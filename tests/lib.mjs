import { chromium } from "playwright-core";

export class Failure extends Error {}

export async function start(base, ids) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.evaluate((s) => localStorage.setItem("tilde:v1", JSON.stringify({ stars: s, attempts: {} })), Object.fromEntries(ids.map((id) => [id, 3])));
  await page.reload();

  const idle = () => page.waitForFunction(() => document.querySelector("#overlay").hidden && !document.querySelector("#btn-check").disabled, null, { timeout: 180000 });
  const screen = () => page.evaluate(() => [...document.querySelectorAll(".xterm-rows > div")].map((d) => d.textContent.replace(/\s+$/, "")).filter(Boolean));

  // Done when the screen has settled on a prompt, either bash's own or a continuation line.
  async function settled() {
    let previous = null;
    for (let i = 0; i < 300; i++) {
      await page.waitForTimeout(100);
      const lines = await screen();
      const text = lines.join("\n");
      if (text === previous && /[$>]$/.test(lines.at(-1) ?? "")) return;
      previous = text;
    }
    throw new Failure("the shell never came back to a prompt");
  }

  async function type(command, wait = 0) {
    await page.click("#terminal");
    await page.keyboard.type(command);
    await page.keyboard.press("Enter");
    await settled();
    if (wait) await page.waitForTimeout(wait);
  }

  async function check() {
    await page.click("#btn-check");
    await page.waitForFunction(() => !document.querySelector("#btn-check").disabled, null, { timeout: 60000 });
    return page.$eval("#result", (e) => e.innerText);
  }

  return {
    page, browser, errors, type,
    async play(id) {
      await page.evaluate(() => (location.hash = "#/"));
      await page.evaluate((id) => (location.hash = "#/level/" + id), id);
      await idle();
      await settled();
    },
    async reset() { await page.click("#btn-reset"); await idle(); await settled(); },
    async solved(label, stars = "★★★") {
      const result = await check();
      if (!result.includes(`Solved ${stars}`)) throw new Failure(`${label}: should solve, got: ${result.slice(0, 300)}`);
    },
    async rejected(label, text) {
      const result = await check();
      if (/Solved/.test(result)) throw new Failure(`${label}: should have been rejected`);
      if (text && !result.includes(text)) throw new Failure(`${label}: expected "${text}", got: ${result.slice(0, 300)}`);
    },
    async write(file, lines) {
      await type(`cat > ${file} <<'EOF'`);
      for (const line of lines) await type(line);
      await type("EOF");
    },
  };
}
