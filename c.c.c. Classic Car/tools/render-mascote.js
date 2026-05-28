const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const puppeteer = require("puppeteer-core");

const root = path.resolve(__dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const frameDir = path.join(root, "tools", "mascote-frames");
const webpFrameDir = path.join(root, "tools", "mascote-webp-frames");
const output = path.join(root, "img", "mascoteanimado.webp");
const cwebp = path.join(root, "node_modules", "webp-converter", "bin", "libwebp_win64", "bin", "cwebp.exe");
const webpmux = path.join(root, "node_modules", "webp-converter", "bin", "libwebp_win64", "bin", "webpmux.exe");

fs.rmSync(frameDir, { recursive: true, force: true });
fs.rmSync(webpFrameDir, { recursive: true, force: true });
fs.mkdirSync(frameDir, { recursive: true });
fs.mkdirSync(webpFrameDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: [
      "--allow-file-access-from-files",
      "--disable-web-security",
      "--hide-scrollbars",
      "--no-sandbox"
    ]
  });

  const page = await browser.newPage();
  page.on("console", (message) => console.log("PAGE:", message.type(), message.text()));
  page.on("pageerror", (error) => console.error("PAGE ERROR:", error.message));
  await page.setViewport({ width: 768, height: 768, deviceScaleFactor: 1 });
  await page.goto(`file:///${path.join(root, "tools", "render-mascote.html").replace(/\\/g, "/")}`);
  await page.waitForFunction("window.__ready === true", { timeout: 180000 });

  const duration = await page.evaluate("window.__duration");
  const frameCount = 32;
  const delay = 75;

  for (let i = 0; i < frameCount; i++) {
    const time = (duration * i) / frameCount;
    const dataUrl = await page.evaluate((t) => {
      window.__renderFrame(t);
      window.__renderFrame(t);
      return document.querySelector("canvas").toDataURL("image/png");
    }, time);
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(path.join(frameDir, `frame-${String(i).padStart(3, "0")}.png`), Buffer.from(base64, "base64"));
  }

  await browser.close();

  const muxArgs = [];

  for (let i = 0; i < frameCount; i++) {
    const png = path.join(frameDir, `frame-${String(i).padStart(3, "0")}.png`);
    const webp = path.join(webpFrameDir, `frame-${String(i).padStart(3, "0")}.webp`);
    execFileSync(cwebp, [
      "-q",
      "90",
      "-alpha_q",
      "100",
      "-m",
      "6",
      png,
      "-o",
      webp
    ], { stdio: "inherit" });

    muxArgs.push("-frame", webp, `+${delay}+0+0+0-b`);
  }

  muxArgs.push("-loop", "0", "-bgcolor", "0,0,0,0", "-o", output);
  execFileSync(webpmux, muxArgs, { stdio: "inherit" });

  console.log(output);
})();
