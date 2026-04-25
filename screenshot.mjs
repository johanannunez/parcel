#!/usr/bin/env node
// screenshot.mjs -- Unified Playwright screenshot tool
// Usage: node screenshot.mjs <url> [label] [flags]
//
// See docs/plans/2026-03-16-playwright-screenshot-tool-design.md for full flag reference.
//
// Core capture:
//   --el ".selector"         Capture element only
//   --scroll "#id"           Scroll to element, capture viewport
//   --width N                Viewport width (default: from package.json)
//   --height N               Viewport height (default: from package.json)
//   --dpr N                  Device pixel ratio (default: from package.json)
//   --full                   Force full page capture
//   --device "iPhone 15"     Playwright device preset
//   --theme dark|light       Emulate color scheme + localStorage + data-theme
//   --freeze                 Disable CSS animations (default: on)
//   --no-freeze              Allow animations to run
//   --trigger-animations     Scroll page to fire IntersectionObserver reveals
//   --scroll-speed N         Pixels per scroll step (default: 400)
//   --mask ".sel,.sel"       Mask elements with colored overlay
//
// Diffing:
//   --diff                   Compare against saved baseline
//   --update-baseline        Save capture as new baseline
//   --threshold N            Color sensitivity 0-1 (default: 0.2)
//   --max-diff-pixels N      Flag if more than N pixels differ
//   --max-diff-percent N     Flag if more than N% pixels differ
//   --ignore-antialiasing    Skip subpixel diffs (default: on)
//   --no-ignore-antialiasing Include antialiasing diffs
//   --side-by-side           Triple-panel: baseline | current | diff
//   --highlight-color "c"    Diff highlight color (default: magenta)
//
// Motion:
//   --record                 Record video (.webm)
//   --record-duration N      Seconds to record (default: 3)
//   --gif                    Convert .webm to .gif (requires ffmpeg)
//   --filmstrip              Capture frames at intervals
//   --filmstrip-interval N   Milliseconds between frames (default: 200)
//
// Interaction:
//   --click ".selector"      Click element before capture
//   --hover ".selector"      Hover element before capture
//   --type ".sel" "text"     Type into input before capture
//   --select ".sel" "val"    Pick dropdown option before capture
//   --wait-for ".selector"   Wait for element to appear
//   --delay N                Extra wait in ms after interactions

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  copyFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium, devices } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/* ═══════════════════════════════════════════
   Config loader
   ═══════════════════════════════════════════ */

function findProjectConfig() {
  let dir = process.cwd();
  const root = "/";
  while (dir !== root) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (pkg.screenshot) return { config: pkg.screenshot, projectRoot: dir };
      } catch {
        // skip malformed package.json
      }
    }
    dir = dirname(dir);
  }
  return { config: {}, projectRoot: process.cwd() };
}

const { config: projectConfig, projectRoot } = findProjectConfig();

const DEFAULTS = {
  width: projectConfig.width ?? 1440,
  height: projectConfig.height ?? 900,
  dpr: projectConfig.dpr ?? 1,
  port: projectConfig.port ?? 3000,
};

/* ═══════════════════════════════════════════
   Arg parsing
   ═══════════════════════════════════════════ */

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    url: "",
    label: "",
    el: "",
    scroll: "",
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    dpr: DEFAULTS.dpr,
    full: false,
    device: "",
    theme: "",
    freeze: true,
    triggerAnimations: false,
    scrollSpeed: 400,
    mask: "",
    diff: false,
    updateBaseline: false,
    threshold: 0.2,
    maxDiffPixels: 0,
    maxDiffPercent: -1,
    ignoreAntialiasing: true,
    sideBySide: false,
    highlightColor: "magenta",
    record: false,
    recordDuration: 3,
    gif: false,
    filmstrip: false,
    filmstripInterval: 200,
    click: "",
    hover: "",
    type: "",
    typeText: "",
    select: "",
    selectValue: "",
    waitFor: "",
    delay: 0,
    devLogin: false,
  };

  if (!args.length) return opts;
  opts.url = args[0];

  let i = 1;
  if (i < args.length && !args[i].startsWith("--")) {
    opts.label = args[i];
    i++;
  }

  while (i < args.length) {
    const flag = args[i];
    const val = args[i + 1];
    const val2 = args[i + 2];

    switch (flag) {
      case "--el": opts.el = val; i += 2; break;
      case "--scroll": opts.scroll = val; i += 2; break;
      case "--width": opts.width = parseInt(val, 10) || DEFAULTS.width; i += 2; break;
      case "--height": opts.height = parseInt(val, 10) || DEFAULTS.height; i += 2; break;
      case "--dpr": opts.dpr = parseFloat(val) || DEFAULTS.dpr; i += 2; break;
      case "--full": opts.full = true; i++; break;
      case "--device": opts.device = val; i += 2; break;
      case "--theme": opts.theme = val; i += 2; break;
      case "--freeze": opts.freeze = true; i++; break;
      case "--no-freeze": opts.freeze = false; i++; break;
      case "--trigger-animations": opts.triggerAnimations = true; i++; break;
      case "--scroll-speed": opts.scrollSpeed = parseInt(val, 10) || 400; i += 2; break;
      case "--mask": opts.mask = val; i += 2; break;
      case "--diff": opts.diff = true; i++; break;
      case "--update-baseline": opts.updateBaseline = true; i++; break;
      case "--threshold": opts.threshold = parseFloat(val) ?? 0.2; i += 2; break;
      case "--max-diff-pixels": opts.maxDiffPixels = parseInt(val, 10) || 0; i += 2; break;
      case "--max-diff-percent": opts.maxDiffPercent = parseFloat(val) ?? -1; i += 2; break;
      case "--ignore-antialiasing": opts.ignoreAntialiasing = true; i++; break;
      case "--no-ignore-antialiasing": opts.ignoreAntialiasing = false; i++; break;
      case "--side-by-side": opts.sideBySide = true; i++; break;
      case "--highlight-color": opts.highlightColor = val || "magenta"; i += 2; break;
      case "--record": opts.record = true; i++; break;
      case "--record-duration": opts.recordDuration = parseInt(val, 10) || 3; i += 2; break;
      case "--gif": opts.gif = true; i++; break;
      case "--filmstrip": opts.filmstrip = true; i++; break;
      case "--filmstrip-interval": opts.filmstripInterval = parseInt(val, 10) || 200; i += 2; break;
      case "--click": opts.click = val; i += 2; break;
      case "--hover": opts.hover = val; i += 2; break;
      case "--type": opts.type = val; opts.typeText = val2 || ""; i += 3; break;
      case "--select": opts.select = val; opts.selectValue = val2 || ""; i += 3; break;
      case "--wait-for": opts.waitFor = val; i += 2; break;
      case "--delay": opts.delay = parseInt(val, 10) || 0; i += 2; break;
      case "--dev-login": opts.devLogin = true; i++; break;
      default: i++; break;
    }
  }

  return opts;
}

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

function slugify(text, maxWords = 4) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-")
    .replace(/-+/g, "-")
    .substring(0, 40);
}

function getNextIndex(dir, prefix = "snap") {
  if (!existsSync(dir)) return 1;
  const files = readdirSync(dir);
  let max = 0;
  for (const f of files) {
    const match = f.match(new RegExp(`^${prefix}-(\\d+)`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function pad(n) {
  return String(n).padStart(3, "0");
}

const COLOR_MAP = {
  magenta: [255, 0, 255],
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
};

/* ═══════════════════════════════════════════
   Smart label
   ═══════════════════════════════════════════ */

async function getSmartLabel(page, url, manualLabel) {
  if (manualLabel) return slugify(manualLabel);

  const h1 = await page
    .locator("h1")
    .first()
    .textContent({ timeout: 2000 })
    .catch(() => null);
  if (h1 && h1.trim()) return slugify(h1);

  const title = await page.title();
  if (title && title.trim()) return slugify(title.split("|")[0].trim());

  try {
    const path = new URL(url).pathname.replace(/\//g, "-").replace(/^-|-$/g, "");
    if (path) return slugify(path);
  } catch {
    // invalid URL, fall through
  }

  return "page";
}

/* ═══════════════════════════════════════════
   Page setup helpers
   ═══════════════════════════════════════════ */

function buildContextOptions(opts) {
  const contextOpts = {};

  if (opts.device) {
    const preset = devices[opts.device];
    if (!preset) {
      const available = Object.keys(devices).filter((d) => !d.includes("landscape")).slice(0, 15);
      console.error(`Unknown device "${opts.device}". Examples: ${available.join(", ")}...`);
      process.exit(1);
    }
    Object.assign(contextOpts, preset);
  } else {
    contextOpts.viewport = { width: opts.width, height: opts.height };
    contextOpts.deviceScaleFactor = opts.dpr;
  }

  if (opts.theme) {
    contextOpts.colorScheme = opts.theme;
  }

  return contextOpts;
}

async function applyTheme(page, theme) {
  if (!theme) return;
  await page.addInitScript((t) => {
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
}

async function freezeAnimations(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

async function triggerScrollAnimations(page, scrollSpeed) {
  await page.evaluate(async (speed) => {
    const scrollHeight = document.body.scrollHeight;
    for (let y = 0; y <= scrollHeight; y += speed) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  }, scrollSpeed);
  await page.waitForTimeout(1000);
}

async function runInteractions(page, opts) {
  if (opts.click) {
    await page.locator(opts.click).first().click({ timeout: 5000 });
  }
  if (opts.type && opts.typeText) {
    await page.locator(opts.type).first().fill(opts.typeText, { timeout: 5000 });
  }
  if (opts.select && opts.selectValue) {
    await page.locator(opts.select).first().selectOption(opts.selectValue, { timeout: 5000 });
  }
  if (opts.hover) {
    await page.locator(opts.hover).first().hover({ timeout: 5000 });
  }
  if (opts.waitFor) {
    await page.locator(opts.waitFor).first().waitFor({ state: "visible", timeout: 10000 });
  }
  if (opts.delay > 0) {
    await page.waitForTimeout(opts.delay);
  }
}

/* ═══════════════════════════════════════════
   Static screenshot capture
   ═══════════════════════════════════════════ */

async function captureScreenshot(page, opts, filepath) {
  const screenshotOpts = {
    path: filepath,
    animations: opts.freeze ? "disabled" : "allow",
    caret: "hide",
  };

  if (opts.mask) {
    const selectors = opts.mask.split(",").map((s) => s.trim());
    screenshotOpts.mask = selectors.map((s) => page.locator(s));
  }

  if (opts.el) {
    const el = page.locator(opts.el).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      await el.screenshot(screenshotOpts);
    } else {
      console.warn(`Warning: selector "${opts.el}" not found or not visible, falling back to full page`);
      screenshotOpts.fullPage = true;
      await page.screenshot(screenshotOpts);
    }
  } else if (opts.scroll) {
    const el = page.locator(opts.scroll).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    } else {
      console.warn(`Warning: selector "${opts.scroll}" not found, capturing from top`);
    }
    await page.screenshot(screenshotOpts);
  } else if (opts.full) {
    screenshotOpts.fullPage = true;
    await page.screenshot(screenshotOpts);
  } else {
    screenshotOpts.fullPage = true;
    await page.screenshot(screenshotOpts);
  }
}

/* ═══════════════════════════════════════════
   Visual diffing
   ═══════════════════════════════════════════ */

function diffAgainstBaseline(currentPath, label, opts, screenshotDir) {
  const baselinePath = join(screenshotDir, "baselines", `${label}.png`);

  if (!existsSync(baselinePath)) {
    console.warn(`No baseline found at ${baselinePath}`);
    console.warn("Run with --update-baseline first.");
    return;
  }

  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const current = PNG.sync.read(readFileSync(currentPath));

  if (baseline.width !== current.width || baseline.height !== current.height) {
    console.warn(
      `Size mismatch: baseline ${baseline.width}x${baseline.height} vs current ${current.width}x${current.height}`
    );
    console.warn("Cannot diff images of different sizes. Update baseline with --update-baseline.");
    return;
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const diffColor = COLOR_MAP[opts.highlightColor] || COLOR_MAP.magenta;

  const numDiffPixels = pixelmatch(baseline.data, current.data, diff.data, width, height, {
    threshold: opts.threshold,
    includeAA: !opts.ignoreAntialiasing,
    diffColor,
  });

  const totalPixels = width * height;
  const diffPercent = ((numDiffPixels / totalPixels) * 100).toFixed(2);

  if (numDiffPixels === 0) {
    console.log("Diff: IDENTICAL. No pixel differences found.");
    return;
  }

  const diffIndex = getNextIndex(screenshotDir, "diff");
  const diffFilename = `diff-${diffIndex}-${label}.png`;
  const diffPath = join(screenshotDir, diffFilename);
  writeFileSync(diffPath, PNG.sync.write(diff));

  console.log(`Diff: ${numDiffPixels} pixels changed (${diffPercent}%)`);
  console.log(`Diff image: ${diffPath}`);

  const exceedsPixels = opts.maxDiffPixels >= 0 && numDiffPixels > opts.maxDiffPixels;
  const exceedsPercent = opts.maxDiffPercent >= 0 && parseFloat(diffPercent) > opts.maxDiffPercent;
  if (exceedsPixels || exceedsPercent) {
    console.log("THRESHOLD EXCEEDED");
  }

  if (opts.sideBySide) {
    const sbs = new PNG({ width: width * 3, height });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;

        // Left panel: baseline
        const dstLeft = (y * width * 3 + x) * 4;
        sbs.data[dstLeft] = baseline.data[srcIdx];
        sbs.data[dstLeft + 1] = baseline.data[srcIdx + 1];
        sbs.data[dstLeft + 2] = baseline.data[srcIdx + 2];
        sbs.data[dstLeft + 3] = baseline.data[srcIdx + 3];

        // Middle panel: current
        const dstMid = (y * width * 3 + (x + width)) * 4;
        sbs.data[dstMid] = current.data[srcIdx];
        sbs.data[dstMid + 1] = current.data[srcIdx + 1];
        sbs.data[dstMid + 2] = current.data[srcIdx + 2];
        sbs.data[dstMid + 3] = current.data[srcIdx + 3];

        // Right panel: diff
        const dstRight = (y * width * 3 + (x + width * 2)) * 4;
        sbs.data[dstRight] = diff.data[srcIdx];
        sbs.data[dstRight + 1] = diff.data[srcIdx + 1];
        sbs.data[dstRight + 2] = diff.data[srcIdx + 2];
        sbs.data[dstRight + 3] = diff.data[srcIdx + 3];
      }
    }

    const sbsFilename = `sbs-${diffIndex}-${label}.png`;
    const sbsPath = join(screenshotDir, sbsFilename);
    writeFileSync(sbsPath, PNG.sync.write(sbs));
    console.log(`Side-by-side: ${sbsPath}`);
  }
}

/* ═══════════════════════════════════════════
   Video recording + GIF
   ═══════════════════════════════════════════ */

async function recordVideo(browser, opts, screenshotDir) {
  const contextOpts = buildContextOptions(opts);
  const viewport = contextOpts.viewport || { width: opts.width, height: opts.height };

  contextOpts.recordVideo = {
    dir: screenshotDir,
    size: { width: viewport.width, height: viewport.height },
  };

  const recContext = await browser.newContext(contextOpts);
  const recPage = await recContext.newPage();

  if (opts.theme) await applyTheme(recPage, opts.theme);

  await recPage.goto(opts.url, { waitUntil: "networkidle", timeout: 30000 });

  if (opts.freeze) await freezeAnimations(recPage);
  if (opts.triggerAnimations) await triggerScrollAnimations(recPage, opts.scrollSpeed);
  await runInteractions(recPage, opts);

  await recPage.waitForTimeout(opts.recordDuration * 1000);

  const videoPath = await recPage.video().path();
  await recContext.close();

  const label = await getSmartLabelFromUrl(opts.url, opts.label);
  const index = getNextIndex(screenshotDir, "rec");
  const recFilename = `rec-${index}-${label}.webm`;
  const recPath = join(screenshotDir, recFilename);

  if (videoPath && existsSync(videoPath)) {
    renameSync(videoPath, recPath);
    console.log(`Recording saved: ${recPath}`);
  } else {
    console.error("Recording failed: video file not found");
    return;
  }

  if (opts.gif) {
    const gifPath = recPath.replace(".webm", ".gif");
    try {
      execFileSync("ffmpeg", [
        "-i", recPath,
        "-vf", `fps=15,scale=${viewport.width}:-1:flags=lanczos`,
        "-y", gifPath,
      ], { stdio: "pipe" });
      console.log(`GIF saved: ${gifPath}`);
    } catch {
      console.error("GIF conversion failed. Is ffmpeg installed? Run: brew install ffmpeg");
    }
  }
}

function getSmartLabelFromUrl(url, manualLabel) {
  if (manualLabel) return slugify(manualLabel);
  try {
    const path = new URL(url).pathname.replace(/\//g, "-").replace(/^-|-$/g, "");
    if (path) return slugify(path);
  } catch {
    // invalid URL
  }
  return "page";
}

/* ═══════════════════════════════════════════
   Filmstrip capture
   ═══════════════════════════════════════════ */

async function captureFilmstrip(page, opts, screenshotDir) {
  const label = await getSmartLabel(page, opts.url, opts.label);
  const index = getNextIndex(screenshotDir, "filmstrip");
  const filmstripDir = join(screenshotDir, `filmstrip-${index}-${label}`);
  ensureDir(filmstripDir);

  const totalMs = opts.recordDuration * 1000;
  const interval = opts.filmstripInterval;
  let frame = 1;

  // First frame: current state
  await page.screenshot({ path: join(filmstripDir, `frame-${pad(frame)}.png`) });
  frame++;

  // If scroll-triggered animations, capture during scroll
  if (opts.triggerAnimations) {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= scrollHeight; y += opts.scrollSpeed) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(interval);
      await page.screenshot({ path: join(filmstripDir, `frame-${pad(frame)}.png`) });
      frame++;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // Run interactions
  await runInteractions(page, opts);

  // Capture remaining frames over duration
  const elapsed = (frame - 1) * interval;
  const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / interval));
  for (let i = 0; i < remaining; i++) {
    await page.waitForTimeout(interval);
    await page.screenshot({ path: join(filmstripDir, `frame-${pad(frame)}.png`) });
    frame++;
  }

  console.log(`Filmstrip saved: ${filmstripDir} (${frame - 1} frames)`);
}

/* ═══════════════════════════════════════════
   Main
   ═══════════════════════════════════════════ */

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.url) {
    console.error("Usage: node screenshot.mjs <url> [label] [flags]");
    console.error("Docs: docs/plans/2026-03-16-playwright-screenshot-tool-design.md");
    process.exit(1);
  }

  const SCREENSHOT_DIR = join(projectRoot, "temporary screenshots");
  ensureDir(SCREENSHOT_DIR);

  const browser = await chromium.launch({ headless: true });

  // Recording needs its own context (recordVideo must be set at creation)
  if (opts.record) {
    await recordVideo(browser, opts, SCREENSHOT_DIR);
    await browser.close();
    return;
  }

  // Standard context for screenshots and filmstrips
  const contextOpts = buildContextOptions(opts);
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  if (opts.theme) await applyTheme(page, opts.theme);

  if (opts.devLogin) {
    const loginOrigin = new URL(opts.url).origin;
    await page.goto(`${loginOrigin}/api/dev/screenshot-auth`, { waitUntil: "networkidle", timeout: 20000 });
  }

  await page.goto(opts.url, { waitUntil: "networkidle", timeout: 30000 });

  // Execution order per design doc
  if (opts.freeze) await freezeAnimations(page);
  if (opts.triggerAnimations) await triggerScrollAnimations(page, opts.scrollSpeed);

  // Filmstrip branch (captures frames during interactions)
  if (opts.filmstrip) {
    // For filmstrip, interactions happen inside the filmstrip function
    await captureFilmstrip(page, opts, SCREENSHOT_DIR);
    await browser.close();
    return;
  }

  // Run interactions for static screenshots
  await runInteractions(page, opts);

  // Static screenshot
  const label = await getSmartLabel(page, opts.url, opts.label);
  const index = getNextIndex(SCREENSHOT_DIR, "snap");
  const filename = `snap-${index}-${label}.png`;
  const filepath = join(SCREENSHOT_DIR, filename);

  await captureScreenshot(page, opts, filepath);
  console.log(`Saved: ${filepath}`);

  // Save baseline
  if (opts.updateBaseline) {
    const baselineDir = join(SCREENSHOT_DIR, "baselines");
    ensureDir(baselineDir);
    const baselinePath = join(baselineDir, `${label}.png`);
    copyFileSync(filepath, baselinePath);
    console.log(`Baseline saved: ${baselinePath}`);
  }

  // Diff against baseline
  if (opts.diff) {
    diffAgainstBaseline(filepath, label, opts, SCREENSHOT_DIR);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
