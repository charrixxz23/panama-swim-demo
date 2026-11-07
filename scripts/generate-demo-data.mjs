// Genera src/data/demo-dataset.json: datos 100 % SINTÉTICOS para la demo.
//   node scripts/generate-demo-data.mjs
// Es determinista (semilla fija): el mismo comando produce siempre el mismo archivo.
//
// Nota metodológica: para que los tiempos sean verosímiles, el GENERADOR parte de tiempos de
// referencia por prueba y aplica factores de edad, talento y mejora. Para piscina corta usa un
// factor aproximado solo al fabricar datos ficticios. La APLICACIÓN nunca convierte tiempos
// entre piscinas ni compara marcas de 25 m con marcas de 50 m.
import { writeFileSync } from "node:fs";

let seed = 20261107;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => a + rand() * (b - a);
const cs = (ms) => Math.round(ms / 10) * 10; // redondeo a centésimas

// ---------------------------------------------------------------- referencias públicas
// Categorías por edad citadas en notas de prensa sobre competencias de la FPN y la LPNP
// (ver docs/fuentes-y-datos.md). Son una referencia, no un reglamento vigente.
const categories = [
  { id: "9-10", label: "9-10 años (Infantil B)", minAge: 9, maxAge: 10 },
  { id: "11-12", label: "11-12 años", minAge: 11, maxAge: 12 },
  { id: "13-14", label: "13-14 años (Juvenil A)", minAge: 13, maxAge: 14 },
  { id: "15-17", label: "15-17 años (Juvenil B)", minAge: 15, maxAge: 17 },
  { id: "18+", label: "18 años y más (Senior)", minAge: 18, maxAge: null },
];
const categoryForAge = (age) => categories.find((c) => age >= c.minAge && (c.maxAge === null || age <= c.maxAge))?.id ?? null;

const pools = [
  { id: "eileen-coparropa", name: "Piscina Olímpica Eileen Coparropa", city: "Juan Díaz, Panamá", province: "Panamá", courses: ["LCM"], real: true },
  { id: "demo-david", name: "Piscina Demo de David", city: "David", province: "Chiriquí", courses: ["LCM", "SCM"], real: false },
  { id: "demo-chitre", name: "Piscina Demo de Chitré", city: "Chitré", province: "Herrera", courses: ["SCM"], real: false },
  { id: "demo-colon", name: "Piscina Demo de Colón", city: "Colón", province: "Colón", courses: ["SCM", "LCM"], real: false },
  { id: "demo-santiago", name: "Piscina Demo de Santiago", city: "Santiago", province: "Veraguas", courses: ["SCM"], real: false },
];

// ---------------------------------------------------------------- clubes y personas ficticias
const clubs = [
  ["corriente-azul", "Club Demo Corriente Azul", "Corriente Azul", "Panamá"],
  ["brisas-istmo", "Club Demo Brisas del Istmo", "Brisas del Istmo", "Panamá Oeste"],
  ["manglar", "Club Demo Manglar Atlántico", "Manglar Atlántico", "Colón"],
  ["baru", "Club Demo Cumbre Barú", "Cumbre Barú", "Chiriquí"],
  ["azuero", "Club Demo Azuero Acuático", "Azuero Acuático", "Herrera"],
  ["santiago", "Club Demo Raudal de Santiago", "Raudal de Santiago", "Veraguas"],
  ["anton", "Club Demo Valle de Antón", "Valle de Antón", "Coclé"],
].map(([id, name, shortName, province]) => ({ id, name, shortName, province, synthetic: true }));

const firstF = ["Valeria", "Camila", "Isabella", "Ana Lucía", "Mariana", "Sofía", "Daniela", "Gabriela", "Lucía", "Paula", "Andrea", "Ximena", "Natalia", "Elena", "Carla", "Regina"];
const firstM = ["Mateo", "Santiago", "Sebastián", "Diego", "Luis", "Gabriel", "Andrés", "Samuel", "Joaquín", "Emiliano", "Tomás", "Iván", "Rodrigo", "Adrián", "Héctor", "Julián"];
const lasts = ["Rodríguez", "González", "Castillo", "Herrera", "Vega", "Sánchez", "Moreno", "Quintero", "Batista", "Saavedra", "Arosemena", "Delgado", "Montenegro", "Navarro", "Cedeño", "Ríos", "Pinzón", "Ortega", "Barría", "Samaniego"];

const coaches = clubs.flatMap((c, i) => {
  const n = i % 3 === 0 ? 2 : 1;
  return Array.from({ length: n }, (_, k) => ({
    id: `coach-${c.id}-${k + 1}`,
    name: `${pick(rand() < 0.5 ? firstF : firstM)} ${pick(lasts)}`,
    clubId: c.id,
    synthetic: true,
  }));
});

// Años de nacimiento → categoría en 2026: 2016-17 (9-10), 2014-15 (11-12), 2012-13 (13-14), 2009-11 (15-17), ≤2008 (18+)
const birthYears = [2016, 2017, 2014, 2015, 2012, 2013, 2010, 2011, 2009, 2007, 2005];
const swimmers = [];
const usedNames = new Set();
for (const club of clubs) {
  for (let i = 0; i < 12; i++) {
    const gender = i % 2 === 0 ? "F" : "M";
    let firstName, lastName;
    do {
      firstName = pick(gender === "F" ? firstF : firstM);
      lastName = `${pick(lasts)} ${pick(lasts)}`;
    } while (usedNames.has(`${firstName} ${lastName}`) || (firstName === "Daniel" && lastName.startsWith("Pérez")));
    usedNames.add(`${firstName} ${lastName}`);
    swimmers.push({
      id: `${club.id}-${i + 1}`,
      firstName,
      lastName,
      gender,
      birthYear: birthYears[(i + clubs.indexOf(club) * 3) % birthYears.length],
      clubId: club.id,
      synthetic: true,
      published: true,
      talent: between(0.95, 1.1),
    });
  }
}
// Nadador del ejemplo del enunciado (ficticio).
swimmers.unshift({
  id: "daniel-perez",
  firstName: "Daniel",
  lastName: "Pérez",
  gender: "M",
  birthYear: 2012,
  clubId: "corriente-azul",
  synthetic: true,
  published: true,
  talent: 1.0,
});

// ---------------------------------------------------------------- competencias ficticias
const ALL = categories.map((c) => c.id);
const reqBase = [
  "Afiliación vigente del club y del atleta (requisito ilustrativo de la demo).",
  "Inscripción por el club dentro del plazo.",
];
const comp = (id, name, type, start, end, poolId, course, regOpens, regCloses, extra = {}) => ({
  id,
  name,
  type,
  startDate: start,
  endDate: end,
  poolId,
  course,
  categories: extra.categories ?? ALL,
  requirements: extra.requirements ?? reqBase,
  registration: { opens: regOpens, closes: regCloses },
  documents: extra.documents ?? [
    { title: "Convocatoria (documento de ejemplo)", url: null },
    { title: "Programa de pruebas (documento de ejemplo)", url: null },
  ],
  synthetic: true,
  published: extra.published ?? true,
  results: extra.results ?? true,
  month: extra.month,
});

const competitions = [
  comp("evaluativa-1-2026", "I Evaluativa Nacional 2026", "evaluativa", "2026-01-23", "2026-01-25", "eileen-coparropa", "LCM", "2025-12-15", "2026-01-16", { month: 0 }),
  comp("copa-chiriqui-2026", "Copa Primavera Chiriquí 2026", "copa", "2026-03-13", "2026-03-15", "demo-david", "LCM", "2026-02-09", "2026-03-06", { month: 2 }),
  comp("evaluativa-2-2026", "II Evaluativa Nacional 2026", "evaluativa", "2026-05-15", "2026-05-17", "eileen-coparropa", "LCM", "2026-04-13", "2026-05-08", { month: 4 }),
  comp("open-verano-2026", "Open de Verano 2026", "open", "2026-07-17", "2026-07-19", "eileen-coparropa", "LCM", "2026-06-15", "2026-07-10", { month: 6 }),
  comp("evaluativa-3-2026", "III Evaluativa Nacional 2026", "evaluativa", "2026-09-18", "2026-09-20", "eileen-coparropa", "LCM", "2026-08-17", "2026-09-11", { month: 8 }),
  comp("copa-azuero-2026", "Copa Azuero de Piscina Corta 2026", "copa", "2026-10-09", "2026-10-11", "demo-chitre", "SCM", "2026-09-07", "2026-10-02", {
    month: 9,
    results: false, // resultados pendientes: se cargan con el CSV de ejemplo en Administración
  }),
  comp("copa-colon-2026", "Copa Colón de Piscina Corta 2026", "copa", "2026-11-20", "2026-11-22", "demo-colon", "SCM", "2026-10-19", "2026-11-13", { results: false }),
  comp("nacional-lcm-2026", "Campeonato Nacional de Piscina Larga 2026", "campeonato", "2026-12-04", "2026-12-06", "eileen-coparropa", "LCM", "2026-11-02", "2026-11-25", {
    results: false,
    requirements: [
      ...reqBase,
      "Marca mínima de la prueba lograda en piscina de 50 m durante 2026 (marcas mínimas ficticias de la demo).",
      "Alcanzar la marca mínima no garantiza la inscripción: la decide la organización según el reglamento.",
    ],
  }),
  comp("evaluativa-1-2027", "I Evaluativa Nacional 2027", "evaluativa", "2027-01-22", "2027-01-24", "eileen-coparropa", "LCM", "2026-12-14", "2027-01-15", { results: false }),
  comp("selectivo-regional-2027", "Selectivo Regional 2027", "selectivo", "2027-03-19", "2027-03-21", "eileen-coparropa", "LCM", "2027-02-08", "2027-03-05", {
    results: false,
    categories: ["13-14", "15-17", "18+"],
    requirements: [
      ...reqBase,
      "Marca mínima ficticia de la demo en piscina de 50 m.",
      "La selección final depende de criterios técnicos adicionales.",
    ],
  }),
  comp("nacional-scm-2027", "Campeonato Nacional de Piscina Corta 2027", "campeonato", "2027-05-14", "2027-05-16", "demo-santiago", "SCM", "2027-04-05", "2027-05-03", {
    results: false,
    requirements: [...reqBase, "Marca mínima ficticia de la demo en piscina de 25 m."],
  }),
  comp("festival-infantil-2027", "Festival Infantil 2027 (borrador)", "copa", "2027-02-26", "2027-02-27", "demo-colon", "SCM", "2027-01-25", "2027-02-19", {
    results: false,
    published: false,
    categories: ["9-10", "11-12"],
  }),
];

// ---------------------------------------------------------------- pruebas
const TEMPLATES = {
  "9-10": [[50, "LIBRE"], [100, "LIBRE"], [50, "ESPALDA"], [50, "PECHO"], [50, "MARIPOSA"]],
  "11-12": [[50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [100, "ESPALDA"], [100, "PECHO"], [50, "MARIPOSA"], [100, "MARIPOSA"], [200, "COMBINADO"]],
  senior: [[50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [400, "LIBRE"], [100, "ESPALDA"], [100, "PECHO"], [100, "MARIPOSA"], [200, "COMBINADO"]],
};
const template = (cat) => TEMPLATES[cat] ?? TEMPLATES.senior;

const events = [];
for (const c of competitions) {
  let n = 1;
  for (const cat of c.categories)
    for (const [distance, stroke] of template(cat))
      for (const gender of ["F", "M"])
        events.push({ id: `${c.id}-e${n}`, competitionId: c.id, number: n++, distance, stroke, gender, categoryId: cat });
}

// ---------------------------------------------------------------- modelo de rendimiento (solo generador)
const BASE_M = { "50-LIBRE": 25.6, "100-LIBRE": 55.8, "200-LIBRE": 122, "400-LIBRE": 262, "50-ESPALDA": 30.2, "100-ESPALDA": 62.5, "50-PECHO": 32.5, "100-PECHO": 70, "50-MARIPOSA": 27.6, "100-MARIPOSA": 60.5, "200-COMBINADO": 137 };
const AGE = { "9-10": 1.55, "11-12": 1.34, "13-14": 1.17, "15-17": 1.08, "18+": 1.04 };
const GENDER = { M: 1, F: 1.11 };
const SCM_FACTOR = 0.975; // solo para fabricar datos ficticios

const expectedMs = (s, cat, distance, stroke, course, monthIndex) => {
  const base = BASE_M[`${distance}-${stroke}`] * 1000;
  const improvement = 1 - 0.006 * monthIndex; // ~0,6 % por mes a lo largo de la temporada
  return base * AGE[cat] * GENDER[s.gender] * s.talent * improvement * (course === "SCM" ? SCM_FACTOR : 1);
};

// Progresión exacta del ejemplo del enunciado (100 m libre, piscina de 50 m).
const DANIEL_100L = { "evaluativa-1-2026": 74200, "copa-chiriqui-2026": 71800, "evaluativa-2-2026": 69500, "open-verano-2026": 67100, "evaluativa-3-2026": 64800 };
const DANIEL_EVENTS = [[100, "LIBRE"], [50, "LIBRE"], [200, "LIBRE"], [100, "MARIPOSA"]];

const results = [];
const LANE_ORDER = [4, 5, 3, 6, 2, 7, 1, 8];
for (const c of competitions.filter((x) => x.results)) {
  const year = Number(c.startDate.slice(0, 4));
  const monthIndex = c.month ?? 0;
  const entriesByEvent = new Map();
  for (const s of swimmers) {
    const cat = categoryForAge(year - s.birthYear);
    if (!cat || !c.categories.includes(cat)) continue;
    if (s.id !== "daniel-perez" && rand() < 0.12) continue; // no todos asisten a todas
    const options = template(cat);
    const chosen =
      s.id === "daniel-perez"
        ? DANIEL_EVENTS
        : [...options].sort(() => rand() - 0.5).slice(0, 3 + Math.floor(rand() * 2));
    for (const [distance, stroke] of chosen) {
      const ev = events.find((e) => e.competitionId === c.id && e.categoryId === cat && e.gender === s.gender && e.distance === distance && e.stroke === stroke);
      if (!ev) continue;
      let timeMs;
      if (s.id === "daniel-perez" && distance === 100 && stroke === "LIBRE") timeMs = DANIEL_100L[c.id];
      else timeMs = cs(expectedMs(s, cat, distance, stroke, c.course, monthIndex) * between(0.985, 1.015));
      let status = "OK";
      if (s.id !== "daniel-perez") {
        const r = rand();
        if (r < 0.022) status = "DQ";
        else if (r < 0.04) status = "DNS";
        else if (r < 0.047) status = "DNF";
      }
      if (!entriesByEvent.has(ev.id)) entriesByEvent.set(ev.id, []);
      entriesByEvent.get(ev.id).push({ s, ev, timeMs, status });
    }
  }
  for (const [eventId, entries] of entriesByEvent) {
    // Siembra: los más rápidos en la última serie, carriles centrales primero.
    entries.sort((a, b) => b.timeMs - a.timeMs);
    const heats = Math.ceil(entries.length / 8);
    entries.forEach((en, i) => {
      const heat = Math.floor(i / 8) + 1;
      const posInHeat = i % 8;
      const sizeOfHeat = Math.min(8, entries.length - (heat - 1) * 8);
      const lane = LANE_ORDER[sizeOfHeat - 1 - posInHeat] ?? posInHeat + 1;
      results.push({
        id: `${eventId}-${en.s.id}`,
        competitionId: c.id,
        eventId,
        swimmerId: en.s.id,
        heat: Math.min(heat, heats),
        lane,
        timeMs: en.status === "OK" ? en.timeMs : null,
        status: en.status,
        source: "demo",
        published: true,
      });
    });
  }
}

// ---------------------------------------------------------------- marcas mínimas ficticias
const standards = [];
const STANDARD_COMPS = ["nacional-lcm-2026", "selectivo-regional-2027", "nacional-scm-2027"];
for (const id of STANDARD_COMPS) {
  const c = competitions.find((x) => x.id === id);
  const year = Number(c.startDate.slice(0, 4));
  const strict = c.type === "selectivo" ? 0.93 : 0.955;
  for (const cat of c.categories)
    for (const [distance, stroke] of template(cat))
      for (const gender of ["F", "M"]) {
        const ref = { gender, talent: 1 };
        let timeMs = cs(expectedMs(ref, cat, distance, stroke, c.course, 0) * strict);
        // Marca del ejemplo del enunciado: 100 m libre, masculino 13-14, piscina de 50 m = 1:02.00.
        if (id === "nacional-lcm-2026" && cat === "13-14" && gender === "M" && distance === 100 && stroke === "LIBRE") timeMs = 62000;
        standards.push({
          id: `mm-${id}-${cat}-${gender}-${distance}-${stroke}`,
          competitionId: id,
          categoryId: cat,
          gender,
          distance,
          stroke,
          course: c.course,
          timeMs,
          synthetic: true,
          published: true,
        });
        void year;
      }
}

const dataset = {
  version: 1,
  generatedAt: "2026-11-07",
  categories,
  pools,
  clubs,
  coaches,
  swimmers: swimmers.map(({ talent, ...s }) => s),
  competitions: competitions.map(({ results, month, ...c }) => c),
  events,
  results,
  standards,
  importBatches: [],
};

writeFileSync("src/data/demo-dataset.json", JSON.stringify(dataset) + "\n");
console.log(
  `demo-dataset.json: ${swimmers.length} nadadores, ${clubs.length} clubes, ${competitions.length} competencias, ${events.length} pruebas, ${results.length} resultados, ${standards.length} marcas mínimas`,
);

// CSV de ejemplo para importar en Administración (Copa Azuero, piscina corta, resultados pendientes).
const azuero = competitions.find((c) => c.id === "copa-azuero-2026");
const rows = [["competencia_id", "prueba_id", "nadador_id", "serie", "carril", "tiempo", "estado"]];
const azEvents = events.filter((e) => e.competitionId === azuero.id);
const fmt = (ms) => {
  const c = Math.round(ms / 10);
  const m = Math.floor(c / 6000);
  const s = Math.floor((c % 6000) / 100);
  const h = String(c % 100).padStart(2, "0");
  return m ? `${m}:${String(s).padStart(2, "0")}.${h}` : `${s}.${h}`;
};
const tal = new Map(swimmers.map((s) => [s.id, s]));
for (const ev of azEvents.filter((e) => e.distance <= 100 && e.stroke === "LIBRE")) {
  const pool = swimmers.filter((s) => categoryForAge(2026 - s.birthYear) === ev.categoryId && s.gender === ev.gender);
  pool.slice(0, 6).forEach((s, i) => {
    const status = i === 5 && ev.distance === 50 ? "DNS" : "OK";
    const t = fmt(cs(expectedMs(tal.get(s.id), ev.categoryId, ev.distance, ev.stroke, "SCM", 9) * between(0.99, 1.01)));
    rows.push([azuero.id, ev.id, s.id, "1", String(i + 1), status === "OK" ? t : "", status]);
  });
}
writeFileSync("public/samples/resultados-copa-azuero-demo.csv", "﻿" + rows.map((r) => r.join(",")).join("\r\n") + "\r\n");
// CSV con errores intencionales para demostrar la validación.
const bad = [
  rows[0],
  rows[1],
  rows[1], // duplicado
  [azuero.id, azEvents[0].id, "no-existe", "1", "3", "30.10", "OK"],
  [azuero.id, azEvents[0].id, rows[2][2], "1", "9", "1:75.20", "OK"],
  [azuero.id, azEvents[0].id, rows[3][2], "uno", "2", "", "OK"],
  [azuero.id, azEvents[0].id, rows[4][2], "1", "4", "29.80", "TARDE"],
];
writeFileSync("public/samples/resultados-con-errores-demo.csv", "﻿" + bad.map((r) => r.join(",")).join("\r\n") + "\r\n");
console.log(`CSV de ejemplo: ${rows.length - 1} filas válidas; CSV con errores: ${bad.length - 1} filas`);
