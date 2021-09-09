const fs = require("fs");
const puppeteer = require("puppeteer");
const ZIP_OUT = "html_sheets";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--user-data-dir=C:\\Users\\demidovez\\AppData\\Local\\Google\\Chrome\\User Data",
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 960,
    height: 760,
    deviceScaleFactor: 1,
  });
  await page.setContent(fs.readFileSync(ZIP_OUT + "/Статистика.html", "utf8"));
  //   await page.goto(
  //     "https://docs.google.com/spreadsheets/d/1IN8FjEjJ9KaE2Slyml1eT9jRZX0JSMSH/edit#gid=1273244682"
  //   );
  await page.screenshot({ path: "example2.png" });
  await browser.close();
})();
