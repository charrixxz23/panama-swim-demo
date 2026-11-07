// Capturas del README.  node scripts/screenshots.mjs [URL]   (por defecto, el servidor local de `npm run preview`)
// Requiere: npx playwright install chromium
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:4173/panama-swim-demo/").replace(/\/?$/, "/");
const out = "docs/screenshots";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const settle = async (p) => {
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.waitForTimeout(900);
};
const today = () => {
  window.__PS_TODAY__ = "2026-11-07";
};

const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
await desk.addInitScript(today);
const d = await desk.newPage();
for (const [path, file] of [
  ["", "01-inicio.png"],
  ["marcas-minimas?nadador=daniel-perez&competencia=nacional-lcm-2026&prueba=100-LIBRE", "02-comparador.png"],
  ["nadadores/daniel-perez", "03-perfil.png"],
  ["resultados?competencia=evaluativa-3-2026", "04-resultados.png"],
  ["calendario?vista=mes&mes=2026-12", "05-calendario.png"],
  ["admin?seccion=importar", "06-administracion.png"],
]) {
  await d.goto(base + path);
  await settle(d);
  await d.screenshot({ path: `${out}/${file}` });
  console.log("✓", file);
}
await d.goto(base + "nadadores/daniel-perez");
await settle(d);
await d.locator("#progreso").scrollIntoViewIfNeeded();
await d.screenshot({ path: `${out}/07-progresion.png` });
console.log("✓ 07-progresion.png");

const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
await dark.addInitScript(today);
const k = await dark.newPage();
await k.goto(base + "competencias/nacional-lcm-2026");
await settle(k);
await k.screenshot({ path: `${out}/08-competencia-oscuro.png` });
console.log("✓ 08-competencia-oscuro.png");

const mob = await browser.newContext({ ...devices["Pixel 7"], deviceScaleFactor: 2, colorScheme: "light" });
await mob.addInitScript(today);
const m = await mob.newPage();
await m.goto(base);
await settle(m);
await m.screenshot({ path: `${out}/09-inicio-movil.png` });
await m.goto(base + "marcas-minimas?nadador=daniel-perez&competencia=nacional-lcm-2026&prueba=100-LIBRE");
await settle(m);
await m.locator('[data-tour="comparator-result"]').scrollIntoViewIfNeeded();
await m.screenshot({ path: `${out}/10-comparador-movil.png` });
await m.goto(base);
await m.getByRole("button", { name: "Abrir menú" }).click();
await m.getByRole("dialog", { name: "Menú" }).getByRole("button", { name: "Explorar Panamá Swim" }).click();
await settle(m);
await m.screenshot({ path: `${out}/11-recorrido-movil.png` });
console.log("✓ capturas móviles");
await browser.close();
