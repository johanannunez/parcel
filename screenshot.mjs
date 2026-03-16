#!/usr/bin/env node
import puppeteer from "puppeteer";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const DIR = "./temporary screenshots";
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

const url = process.argv[2] || "http://localhost:3001";
const label = process.argv[3] || "page";

const existing = readdirSync(DIR).filter((f) => f.startsWith("snap-"));
const nextNum = existing.length
  ? Math.max(...existing.map((f) => parseInt(f.split("-")[1]))) + 1
  : 1;
const filename = `snap-${nextNum}-${label}.png`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

await page.evaluateOnNewDocument(() => {
  localStorage.setItem("theme", "light");
  document.documentElement.setAttribute("data-theme", "light");
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 });
await new Promise((r) => setTimeout(r, 500));

// Scroll through the page to trigger IntersectionObserver animations
await page.evaluate(async () => {
  const scrollHeight = document.body.scrollHeight;
  const step = 400;
  for (let y = 0; y <= scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 100));
  }
  // Scroll back to top for a clean full-page capture
  window.scrollTo(0, 0);
});

// Wait for animations to settle
await new Promise((r) => setTimeout(r, 1500));

await page.screenshot({ path: join(DIR, filename), fullPage: true });
console.log(`Saved: ${join(DIR, filename)}`);
await browser.close();
