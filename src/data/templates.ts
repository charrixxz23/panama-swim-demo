import type { CategoryId, Competition, Gender, Stroke, SwimEvent } from "../models";

/** Programa de pruebas por categoría (el mismo que usa el generador de datos). */
export const EVENT_TEMPLATES: Record<CategoryId, [number, Stroke][]> = {
  "9-10": [[50, "LIBRE"], [100, "LIBRE"], [50, "ESPALDA"], [50, "PECHO"], [50, "MARIPOSA"]],
  "11-12": [[50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [100, "ESPALDA"], [100, "PECHO"], [50, "MARIPOSA"], [100, "MARIPOSA"], [200, "COMBINADO"]],
  "13-14": [[50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [400, "LIBRE"], [100, "ESPALDA"], [100, "PECHO"], [100, "MARIPOSA"], [200, "COMBINADO"]],
  "15-17": [[50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [400, "LIBRE"], [100, "ESPALDA"], [100, "PECHO"], [100, "MARIPOSA"], [200, "COMBINADO"]],
  "18+": [[50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [400, "LIBRE"], [100, "ESPALDA"], [100, "PECHO"], [100, "MARIPOSA"], [200, "COMBINADO"]],
};

/** Distancias y estilos posibles (pruebas individuales de piscina). */
export const ALL_EVENTS: [number, Stroke][] = [
  [50, "LIBRE"], [100, "LIBRE"], [200, "LIBRE"], [400, "LIBRE"], [800, "LIBRE"], [1500, "LIBRE"],
  [50, "ESPALDA"], [100, "ESPALDA"], [200, "ESPALDA"],
  [50, "PECHO"], [100, "PECHO"], [200, "PECHO"],
  [50, "MARIPOSA"], [100, "MARIPOSA"], [200, "MARIPOSA"],
  [100, "COMBINADO"], [200, "COMBINADO"], [400, "COMBINADO"],
];

export function buildEvents(c: Pick<Competition, "id" | "categories">): SwimEvent[] {
  const out: SwimEvent[] = [];
  let n = 1;
  for (const cat of c.categories)
    for (const [distance, stroke] of EVENT_TEMPLATES[cat])
      for (const gender of ["F", "M"] as Gender[]) out.push({ id: `${c.id}-e${n}`, competitionId: c.id, number: n++, distance, stroke, gender, categoryId: cat });
  return out;
}
