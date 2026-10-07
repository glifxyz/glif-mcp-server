// Records a demo of the running app to recordings/*.webm with a visible cursor.
// Copy it next to a project that has `playwright` installed, replace the beats below, then run:
//   DEMO_URL=http://localhost:3000 node record-demo.mjs
//   DEMO_MOBILE=1 DEMO_URL=http://localhost:3000 node record-demo.mjs   (phone layout, 860×1864)
import { chromium } from "playwright";

const url = process.env.DEMO_URL ?? "http://localhost:3000";
const mobile = process.env.DEMO_MOBILE === "1";
const viewport = mobile ? { width: 430, height: 932 } : { width: 1920, height: 1080 };
const scale = mobile ? 2 : 1;

const browser = await chromium.launch({ slowMo: 60 });
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: scale,
  isMobile: mobile,
  hasTouch: mobile,
  recordVideo: { dir: "recordings", size: { width: viewport.width * scale, height: viewport.height * scale } },
});
const page = await context.newPage();

// Playwright shows no cursor. Draw one so viewers can follow the clicks.
await page.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const dot = document.createElement("div");
    dot.style.cssText =
      "position:fixed;z-index:2147483647;left:-50px;width:24px;height:24px;margin:-12px 0 0 -12px;" +
      "border-radius:50%;background:rgba(0,0,0,.35);border:2px solid #fff;pointer-events:none;transition:transform .15s";
    document.body.append(dot);
    addEventListener("mousemove", (e) => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; });
    addEventListener("mousedown", () => { dot.style.transform = "scale(.7)"; });
    addEventListener("mouseup", () => { dot.style.transform = ""; });
  });
});

// Prints each beat's time so captions can line up with the footage.
const start = Date.now();
const beat = (label) => console.log(`${((Date.now() - start) / 1000).toFixed(1)}s  ${label}`);
const pause = (ms) => page.waitForTimeout(ms);
async function glideClick(locator) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 30 });
  await pause(250);
  await locator.click();
}
async function smoothScroll(pixels) {
  for (let moved = 0; moved < pixels; moved += 40) {
    await page.mouse.wheel(0, 40);
    await pause(25);
  }
}

await page.goto(url);
await pause(1500);

// Replace these beats with the real flow.
beat("Home page");
await glideClick(page.getByRole("button", { name: "New project" }));
await pause(1500);
beat("Project created");
await smoothScroll(800);
await pause(1000);
beat("End");

const video = page.video();
await context.close(); // The video is written when the context closes.
console.log(`Saved ${await video.path()}`);
await browser.close();
