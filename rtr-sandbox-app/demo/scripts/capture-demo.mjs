import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:5173";
const OUT = "/tmp/rtr-demo/frames";
fs.mkdirSync(OUT, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await sleep(400);
  await page.screenshot({ path: file, fullPage: false });
  console.log("captured", name);
  return file;
}

async function clickText(page, text, selector = "button") {
  const handle = await page.evaluateHandle(
    (sel, t) => {
      const nodes = Array.from(document.querySelectorAll(sel));
      return (
        nodes.find((n) => (n.textContent || "").trim().includes(t)) || null
      );
    },
    selector,
    text
  );
  const el = handle.asElement();
  if (!el) throw new Error(`Could not find ${selector} with text: ${text}`);
  await el.click();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/google-chrome-stable",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1440,900",
      "--force-device-scale-factor=1",
    ],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(45000);

  // Clear prior session state for a clean demo
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await sleep(800);
  await shot(page, "01-home");

  // Credentials panel visible
  await page.evaluate(() => {
    const el = document.querySelector(".credentials-panel");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await shot(page, "02-credentials");

  // Guided tour section
  await page.evaluate(() => {
    const el = document.querySelector(".guided-tour");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await shot(page, "03-guided-tour");

  // Run guided tour
  await clickText(page, "Run guided tour");
  // Wait for tour to progress through steps
  for (let i = 0; i < 40; i++) {
    const running = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button")).some((b) =>
        (b.textContent || "").includes("Running tour")
      )
    );
    if (!running && i > 3) break;
    if (i === 4) await shot(page, "04-tour-running");
    await sleep(700);
  }
  await sleep(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "05-tour-complete");

  // Focus readable results
  await page.evaluate(() => {
    const el = document.querySelector(".results-intro, .summary-card");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await sleep(400);
  await shot(page, "06-readable-results");

  // Open Send Payment scenario manually and show form
  await clickText(page, "Send Payment (pacs.008)", "button.scenario-btn, button");
  await sleep(600);
  await page.evaluate(() => window.scrollTo(0, 200));
  await shot(page, "07-send-payment-form");

  await clickText(page, "Run scenario");
  await sleep(2500);
  await page.evaluate(() => {
    const el = document.querySelector(".friendly-grid, .summary-card");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await shot(page, "08-payment-accepted");

  // Activity panel / latest payment
  await page.evaluate(() => {
    const el = document.querySelector(".activity-panel, .last-payment-card");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await shot(page, "09-activity-panel");

  // Check payment status shortcut if available
  const hasCheck = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).some((b) =>
      (b.textContent || "").includes("Check this payment")
    )
  );
  if (hasCheck) {
    await clickText(page, "Check this payment");
    await sleep(800);
    await page.evaluate(() => window.scrollTo(0, 180));
    await shot(page, "10-status-prefilled");
    await clickText(page, "Run scenario");
    await sleep(2500);
    await page.evaluate(() => {
      const el = document.querySelector(".summary-card.tone-success, .friendly-grid");
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await shot(page, "11-status-result");
  }

  // Interest report for variety
  await clickText(page, "Interest Report", "button.scenario-btn, button");
  await sleep(500);
  await clickText(page, "Run scenario");
  await sleep(2500);
  await page.evaluate(() => {
    const el = document.querySelector(".summary-table, .summary-card");
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await shot(page, "12-interest-report");

  // Glossary
  await page.evaluate(() => {
    const details = document.querySelector(".glossary");
    if (details) {
      details.open = true;
      details.scrollIntoView({ behavior: "instant", block: "center" });
    }
  });
  await sleep(300);
  await shot(page, "13-glossary");

  // Final wide home view
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  await shot(page, "14-closing");

  await browser.close();
  console.log("All frames captured to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
