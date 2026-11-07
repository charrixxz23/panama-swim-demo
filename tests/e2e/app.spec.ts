import { expect, test, type Page } from "@playwright/test";

const DISCLAIMER = "Prototipo académico independiente inspirado en la natación panameña. No representa una plataforma oficial de la Federación Panameña de Natación.";
const TODAY = "2026-11-07";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((d) => {
    (window as unknown as { __PS_TODAY__: string }).__PS_TODAY__ = d;
  }, TODAY);
});

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Failed to load resource|ERR_|unsplash/i.test(t)) return; // fotos externas
    errors.push(t);
  });
  return errors;
}
const narrow = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1280;
async function nav(page: Page) {
  if (narrow(page)) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    return page.getByRole("dialog", { name: "Menú" });
  }
  return page.getByRole("navigation", { name: "Principal" });
}

const ROUTES = [
  "",
  "calendario",
  "calendario?vista=mes",
  "competencias/nacional-lcm-2026",
  "resultados",
  "nadadores",
  "nadadores/daniel-perez",
  "marcas-minimas",
  "clubes",
  "clubes/corriente-azul",
  "entrenador",
  "admin",
  "acerca",
];

test.describe("rutas", () => {
  for (const r of ROUTES) {
    test(`/${r} carga directa sin errores ni desbordamiento`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(r);
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(page.getByTestId("disclaimer")).toHaveText(DISCLAIMER);
      // Sin desbordamiento horizontal y sin que el navegador móvil tenga que alejar la página para encajarla.
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: window.innerWidth }));
      expect(m.sw, "ancho del documento").toBeLessThanOrEqual(m.cw);
      expect(m.iw, "la página no se aleja para encajar contenido").toBeLessThanOrEqual(m.cw + 1);
      expect(errors).toEqual([]);
    });
  }
  test("ruta inexistente muestra la 404 de la app", async ({ page }) => {
    await page.goto("no-existe/para-nada");
    await expect(page.getByRole("heading", { name: "Fuera del carril" })).toBeVisible();
  });
});

test("navegación principal", async ({ page }) => {
  await page.goto("");
  for (const [label, url] of [
    ["Calendario", /\/calendario$/],
    ["Resultados", /\/resultados$/],
    ["Nadadores", /\/nadadores$/],
    ["Marcas mínimas", /\/marcas-minimas$/],
    ["Clubes", /\/clubes$/],
    ["Administración", /\/admin$/],
    ["Inicio", /\/panama-swim-demo\/?$/],
  ] as const) {
    await (await nav(page)).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.locator("main h1").first()).toBeVisible();
  }
});

test("modo claro y oscuro: cambia y se recuerda", async ({ page }) => {
  await page.goto("");
  const html = page.locator("html");
  const wasDark = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveClass(wasDark ? /^(?!.*dark)/ : /dark/);
  await page.reload();
  expect(await html.evaluate((el) => el.classList.contains("dark"))).toBe(!wasDark);
});

test("calendario: filtros, vista mensual y nada vencido como próximo", async ({ page }) => {
  await page.goto("calendario");
  const proximas = page.locator("section", { has: page.getByRole("heading", { name: "Próximas y en curso" }) });
  const finalizadas = page.locator("section", { has: page.getByRole("heading", { name: "Finalizadas" }) });
  await expect(proximas.getByText("Copa Azuero de Piscina Corta 2026")).toHaveCount(0);
  await expect(finalizadas.getByText("Copa Azuero de Piscina Corta 2026")).toBeVisible();
  await expect(proximas.getByText("Campeonato Nacional de Piscina Larga 2026")).toBeVisible();

  await page.getByLabel("Provincia").selectOption("Colón");
  await expect(page.locator("main").getByRole("status")).toContainText("1 competencia");
  await expect(proximas.getByText("Copa Colón de Piscina Corta 2026")).toBeVisible();
  await page.getByRole("button", { name: "Quitar filtros" }).click();

  await page.getByLabel("Buscar").fill("zzz");
  await expect(page.getByText("Ninguna competencia coincide")).toBeVisible();
  await page.getByLabel("Buscar").fill("");

  await page.getByRole("button", { name: "Mes" }).click();
  await expect(page.getByRole("heading", { name: "Noviembre de 2026" })).toBeVisible();
  await page.getByRole("button", { name: "Mes siguiente" }).click();
  await expect(page.getByRole("heading", { name: "Diciembre de 2026" })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: /Campeonato Nacional de Piscina Larga 2026/ }).first()).toBeVisible();
});

test("calendario: con otra fecha, lo terminado pasa a finalizadas", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __PS_TODAY__: string }).__PS_TODAY__ = "2027-06-01";
  });
  await page.goto("calendario");
  await expect(page.getByText("No hay competencias próximas con estos filtros.")).toBeVisible();
});

test("ficha de competencia: estado, pruebas y marca mínima", async ({ page }) => {
  await page.goto("competencias/nacional-lcm-2026");
  await expect(page.getByTestId("comp-status")).toContainText("Inscripción abierta");
  await page.getByRole("combobox", { name: "Categoría" }).selectOption("13-14");
  const row = page.locator("tr", { hasText: "100 m libre" }).filter({ hasText: "Masculino" });
  await expect(row).toContainText("1:02.00");
  await expect(page.getByText("Piscina larga (50 m)").first()).toBeVisible();
});

test("resultados: filtros, estados y diferencia con el primero", async ({ page }) => {
  await page.goto("resultados?nadador=daniel-perez");
  const table = page.locator('[data-tour="results-table"]');
  await expect(table.locator("tbody tr").first()).toBeVisible();
  await expect(page.locator("main").getByRole("status")).toHaveText("20 resultados en 20 pruebas");
  await expect(table.getByText("1:04.80").first()).toBeVisible();
  await page.getByRole("button", { name: "Quitar el filtro de atleta" }).click();
  await page.getByLabel("Piscina").selectOption("SCM");
  await expect(page.getByText("Ningún resultado coincide")).toBeVisible();
  await page.getByLabel("Piscina").selectOption("");
  await page.getByLabel("Competencia").selectOption("evaluativa-1-2026");
  await expect(page.getByLabel("Prueba")).toBeEnabled();
  // Los estados no válidos no muestran tiempo ni diferencia.
  const dq = page.locator("tbody tr", { has: page.locator('[title="Descalificado"]') }).first();
  if (await dq.count()) await expect(dq.locator("td").nth(4)).toHaveText("—");
});

test("comparador: ejemplo del enunciado y reglas", async ({ page }) => {
  await page.goto("marcas-minimas?nadador=daniel-perez&competencia=nacional-lcm-2026&prueba=100-LIBRE");
  await expect(page.getByTestId("standard-time")).toHaveText("1:02.00");
  await expect(page.getByTestId("swimmer-time")).toHaveText("1:04.80");
  await expect(page.getByTestId("diff")).toHaveText("+2.80 s");
  await expect(page.getByTestId("percent")).toHaveText("+4.52 %");
  await expect(page.getByTestId("verdict")).toContainText("Necesitas reducir 2.80 segundos para alcanzar esta marca objetivo.");

  await page.getByLabel("7. Tiempo personal").fill("1:01.58");
  await expect(page.getByTestId("diff")).toHaveText("−0.42 s");
  await expect(page.getByTestId("verdict")).toContainText("alcanza la marca objetivo");
  await expect(page.getByTestId("verdict")).toContainText("no equivale a una clasificación oficial");

  await page.getByLabel("7. Tiempo personal").fill("1:75.20");
  await expect(page.getByText("los segundos deben estar entre 00 y 59")).toBeVisible();

  await page.getByLabel("7. Tiempo personal").fill("");
  await page.getByLabel("6. Longitud de piscina").selectOption("SCM");
  await expect(page.getByTestId("verdict")).toContainText("No se comparan ni se convierten");
  await expect(page.getByTestId("diff")).toHaveText("—");
});

test("perfil: marcas por piscina, gráfica y comparación entre competencias", async ({ page }) => {
  await page.goto("nadadores/daniel-perez");
  await expect(page.getByRole("heading", { name: "Daniel Pérez", level: 1 })).toBeVisible();
  await expect(page.getByText("Perfil ficticio")).toBeVisible();
  await expect(page.locator('[data-tour="progress-chart"] svg').first()).toBeVisible();
  await expect(page.locator('[data-tour="progress-chart"]')).toContainText("Marca mínima ficticia");
  const comp = page.locator("table", { has: page.getByText("Vs. anterior") });
  await expect(comp.locator("tbody tr")).toHaveCount(5);
  await expect(comp).toContainText("−2.40");
  await expect(comp).toContainText("Mejor marca");
});

test("búsqueda de nadadores y club", async ({ page }) => {
  await page.goto("nadadores");
  await page.getByLabel("Buscar nadador").fill("perez daniel");
  await expect(page.locator("main").getByRole("status")).toHaveText("1 nadador");
  await page.locator("main").getByRole("link", { name: /Daniel Pérez/ }).click();
  await expect(page).toHaveURL(/nadadores\/daniel-perez/);
  await page.goto("clubes");
  await page.getByLabel("Provincia").selectOption("Chiriquí");
  await expect(page.locator("main").getByRole("status")).toHaveText("1 club");
});

test.describe("administración", () => {
  test("CSV válido: validar, importar como pendiente, publicar, persistir y restaurar", async ({ page }) => {
    await page.goto("admin?seccion=importar");
    await page.locator("#csv-file").setInputFiles("public/samples/resultados-copa-azuero-demo.csv");
    await page.getByRole("button", { name: "Validar" }).click();
    const report = page.getByTestId("csv-report");
    await expect(report).toContainText("Errores");
    await expect(report.locator("dd").nth(2)).toHaveText("0");
    await page.getByRole("button", { name: /Importar \d+ filas como pendientes/ }).click();
    await expect(page.getByText(/importados como pendientes de revisión/)).toBeVisible();

    await page.goto("resultados?competencia=copa-azuero-2026");
    await expect(page.getByText("Ningún resultado coincide")).toBeVisible(); // aún no publicado

    await page.goto("admin?seccion=revision");
    await page.getByRole("button", { name: /^Publicar .*csv/ }).click();
    await page.goto("resultados?competencia=copa-azuero-2026");
    await expect(page.getByText("(importado)").first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("(importado)").first()).toBeVisible();

    await page.goto("admin");
    await page.getByRole("button", { name: "Restaurar datos demostrativos" }).click();
    await page.getByRole("button", { name: "Sí, restaurar" }).click();
    await expect(page.getByText("Datos demostrativos restaurados.")).toBeVisible();
    await page.goto("resultados?competencia=copa-azuero-2026");
    await expect(page.getByText("Ningún resultado coincide")).toBeVisible();
  });

  test("CSV con errores: informa y no permite importar", async ({ page }) => {
    await page.goto("admin?seccion=importar");
    await page.locator("#csv-file").setInputFiles("public/samples/resultados-con-errores-demo.csv");
    await page.getByRole("button", { name: "Validar" }).click();
    await expect(page.getByTestId("csv-report")).toContainText("no existe");
    await expect(page.getByTestId("csv-report")).toContainText("1:75.20");
    await expect(page.getByRole("button", { name: /Importar \d+ filas/ })).toHaveCount(0);
  });

  test("crear competencia: valida fechas, queda en borrador y se publica", async ({ page }) => {
    await page.goto("admin");
    await page.getByRole("button", { name: "Crear competencia" }).click();
    await page.locator("#ac-name").fill("Copa de Prueba E2E");
    await page.locator("#ac-start").fill("2027-04-10");
    await page.locator("#ac-end").fill("2027-04-09");
    await page.locator("#ac-open").fill("2027-03-01");
    await page.locator("#ac-close").fill("2027-04-01");
    await page.getByRole("button", { name: "Crear borrador" }).click();
    await expect(page.getByText("La fecha de fin no puede ser anterior a la de inicio.")).toBeVisible();
    await page.locator("#ac-end").fill("2027-04-11");
    await page.getByRole("button", { name: "Crear borrador" }).click();
    await expect(page.getByText(/se creó como borrador/)).toBeVisible();

    await page.goto("calendario?q=Prueba E2E");
    await expect(page.getByText("Ninguna competencia coincide")).toBeVisible();
    await page.goto("admin?seccion=revision");
    await page.getByRole("button", { name: "Publicar Copa de Prueba E2E" }).click();
    await page.goto("calendario?q=Prueba E2E");
    await expect(page.getByRole("link", { name: /Copa de Prueba E2E/ })).toBeVisible();
  });

  test("registrar marca mínima con formato de tiempo validado", async ({ page }) => {
    await page.goto("admin?seccion=marcas");
    await page.getByLabel("Tiempo").fill("abc");
    await page.getByRole("button", { name: "Registrar marca" }).click();
    await expect(page.getByText("no es un tiempo válido")).toBeVisible();
    await page.getByLabel("Tiempo").fill("1:05.30");
    await page.getByRole("button", { name: "Registrar marca" }).click();
    await expect(page.getByText(/como borrador/)).toBeVisible();
  });
});

test("recorrido «Explorar Panamá Swim»: 10 pasos, anterior, finalizar sin bloquear", async ({ page }) => {
  await page.goto("");
  if ((page.viewportSize()?.width ?? 1440) < 768) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog", { name: "Menú" }).getByRole("button", { name: "Explorar Panamá Swim" }).click();
  } else await page.getByTestId("tour-start").click();
  const tour = page.getByTestId("tour");
  const steps = [
    ["El panel", "dashboard"],
    ["Calendario", "calendar"],
    ["Una competencia", "comp-header"],
    ["Pruebas y requisitos", "comp-events"],
    ["Buscar un nadador", "swimmer-search"],
    ["Sus mejores marcas", "best-times"],
    ["Comparar con la marca mínima", "comparator-result"],
    ["Resultados históricos", "results-table"],
    ["Progreso", "progress-chart"],
    ["Gestión demostrativa", "admin"],
  ];
  for (let i = 0; i < steps.length; i++) {
    const [title, target] = steps[i];
    await expect(tour.getByRole("heading")).toHaveText(title);
    await expect(page.locator(`[data-tour="${target}"]`)).toHaveClass(/tour-target/);
    if (i === 2) {
      await tour.getByRole("button", { name: "Anterior" }).click();
      await expect(tour.getByRole("heading")).toHaveText("Calendario");
      await tour.getByRole("button", { name: "Siguiente" }).click();
      await expect(tour.getByRole("heading")).toHaveText("Una competencia");
    }
    if (i === 6) await expect(page.getByTestId("diff")).toHaveText("+2.80 s");
    await tour.getByRole("button", { name: i === steps.length - 1 ? "Finalizar" : "Siguiente" }).click();
  }
  await expect(tour).toHaveCount(0);
  await expect(page.locator(".tour-target")).toHaveCount(0);
  await (await nav(page)).getByRole("link", { name: "Calendario", exact: true }).click();
  await expect(page).toHaveURL(/calendario$/);
});

test("el recorrido se omite con «Omitir»", async ({ page }) => {
  await page.goto("");
  if ((page.viewportSize()?.width ?? 1440) < 768) {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("dialog", { name: "Menú" }).getByRole("button", { name: "Explorar Panamá Swim" }).click();
  } else await page.getByTestId("tour-start").click();
  await page.getByTestId("tour").getByRole("button", { name: "Omitir" }).click();
  await expect(page.getByTestId("tour")).toHaveCount(0);
  await expect(page.locator(".tour-target")).toHaveCount(0);
});

test("enlaces externos seguros y teclado", async ({ page }) => {
  await page.goto("acerca");
  for (const l of await page.locator('a[target="_blank"]').all()) {
    expect(await l.getAttribute("rel")).toContain("noopener");
    expect(await l.getAttribute("href")).toMatch(/^https:\/\//);
  }
  if (narrow(page)) return;
  await page.goto("");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
});

test("privacidad: los perfiles no muestran fecha de nacimiento ni contacto", async ({ page }) => {
  await page.goto("nadadores/daniel-perez");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/2012|@|\+507|cédula/i);
});
