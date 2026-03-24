#!/usr/bin/env node
/**
 * generate-pdf.mjs
 *
 * Launches the Next.js dev server, navigates to /owner-projection/pdf,
 * and generates a Letter-size PDF using Playwright.
 *
 * Usage:
 *   node generate-pdf.mjs                    # outputs to ./output/
 *   node generate-pdf.mjs --out ./my-folder  # custom output directory
 *   node generate-pdf.mjs --port 3001        # use specific port (default: 3001)
 *   node generate-pdf.mjs --no-server        # skip starting dev server (already running)
 */

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { dirname } from "node:path";

const __dirname = dirname(new globalThis.URL(import.meta.url).pathname);

/* ── Parse args ── */
const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}
const PORT = getFlag("--port", "3001");
const OUT_DIR = resolve(__dirname, getFlag("--out", "output"));
const SKIP_SERVER = args.includes("--no-server");
const URL = `http://localhost:${PORT}/owner-projection/pdf`;

/* ── Start dev server (unless --no-server) ── */
let serverProcess = null;

async function startServer() {
  if (SKIP_SERVER) {
    console.log(`  Skipping server start (--no-server). Using port ${PORT}.`);
    return;
  }

  console.log(`  Starting Next.js dev server on port ${PORT}...`);
  serverProcess = spawn("npx", ["next", "dev", "--port", PORT], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  // Wait for server to be ready
  await new Promise((ok, fail) => {
    const timeout = setTimeout(() => fail(new Error("Server start timed out after 30s")), 30_000);
    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes("Ready") || text.includes("ready") || text.includes(`localhost:${PORT}`)) {
        clearTimeout(timeout);
        ok();
      }
    };
    serverProcess.stdout.on("data", onData);
    serverProcess.stderr.on("data", onData);
    serverProcess.on("error", (err) => { clearTimeout(timeout); fail(err); });
    serverProcess.on("exit", (code) => {
      if (code !== null && code !== 0) { clearTimeout(timeout); fail(new Error(`Server exited with code ${code}`)); }
    });
  });

  console.log("  Dev server ready.");
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

/* ── Generate PDF ── */
async function generatePdf() {
  console.log("\n  Revenue Projection PDF Generator");
  console.log("  ================================\n");

  await startServer();

  console.log(`  Launching browser...`);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate and wait for full render
  console.log(`  Loading ${URL}`);
  await page.goto(URL, { waitUntil: "networkidle" });

  // Wait for images to load (logo)
  await page.waitForTimeout(1000);

  // Ensure output directory exists
  await mkdir(OUT_DIR, { recursive: true });

  const filename = `Parcel-Revenue-Projection-403-E-8th-Ave.pdf`;
  const outputPath = join(OUT_DIR, filename);

  console.log(`  Generating PDF...`);
  await page.pdf({
    path: outputPath,
    format: "Letter",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true,
  });

  console.log(`\n  PDF saved to: ${outputPath}`);
  console.log(`  File: ${filename}\n`);

  await browser.close();
  stopServer();
}

generatePdf().catch((err) => {
  console.error("\n  Error:", err.message);
  stopServer();
  process.exit(1);
});
