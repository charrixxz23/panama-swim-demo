// Genera iconos PNG e imagen social a partir del SVG propio. Requiere: npx playwright install chromium
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/icons/favicon.svg", "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
const shot = async (html, w, h, path) => {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0">${html}</body></html>`);
  await page.screenshot({ path });
  console.log("✓", path);
};
const icon = (pad) =>
  `<div style="width:100vw;height:100vh;background:#07182F;display:grid;place-items:center"><div style="width:${100 - pad * 2}vw;height:${100 - pad * 2}vh">${svg.replace("<svg ", '<svg width="100%" height="100%" ')}</div></div>`;
await shot(icon(0), 32, 32, "public/icons/favicon-32.png");
await shot(icon(0), 180, 180, "public/icons/apple-touch-icon.png");
await shot(icon(0), 192, 192, "public/icons/icon-192.png");
await shot(icon(0), 512, 512, "public/icons/icon-512.png");
await shot(icon(14), 512, 512, "public/icons/icon-maskable-512.png");

const font = (f) => `data:font/woff2;base64,${readFileSync(f).toString("base64")}`;
const saira = font("node_modules/@fontsource-variable/saira/files/saira-latin-standard-normal.woff2");
const fig = font("node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2");
const lanes = Array.from({ length: 7 }, (_, i) => `<div style="position:absolute;left:0;right:0;top:${60 + i * 80}px;height:6px;background:repeating-linear-gradient(90deg,#00B7E8 0 22px,#fff 22px 30px,#0969B2 30px 52px,#fff 52px 60px);opacity:.25"></div>`).join("");
await shot(
  `<style>@font-face{font-family:S;src:url(${saira});font-weight:100 900;font-stretch:50% 125%}@font-face{font-family:F;src:url(${fig});font-weight:300 900}</style>
   <div style="width:1200px;height:630px;background:linear-gradient(135deg,#07182F 55%,#0969B2);position:relative;overflow:hidden;font-family:F">
     ${lanes}
     <div style="position:absolute;left:80px;top:80px;width:96px;height:96px">${svg.replace("<svg ", '<svg width="96" height="96" ')}</div>
     <div style="position:absolute;left:80px;top:210px;color:#fff;font-family:S;font-weight:700;font-stretch:118%;font-size:112px;line-height:1">Panamá Swim</div>
     <div style="position:absolute;left:80px;top:340px;color:#00B7E8;font-family:S;font-weight:500;font-stretch:112%;font-size:54px">Cada segundo cuenta</div>
     <div style="position:absolute;left:80px;bottom:64px;color:#fff;opacity:.8;font-size:26px">Prototipo académico independiente · Datos demostrativos</div>
     <div style="position:absolute;right:80px;top:120px;color:#fff;font-family:S;font-weight:600;font-stretch:115%;font-size:96px;font-variant-numeric:tabular-nums">1:04.80</div>
     <div style="position:absolute;right:80px;top:230px;color:#D62839;font-family:S;font-weight:600;font-stretch:115%;font-size:44px">+2.80 s</div>
   </div>`,
  1200,
  630,
  "public/images/og-image.png",
);
await browser.close();
