import type { Category, CategoryId } from "../models";
import { ageInYear } from "../utils/dates";

/** Categoría que corresponde a un año de nacimiento en la fecha de una competencia. */
export function categoryFor(categories: Category[], birthYear: number, isoDate: string): CategoryId | null {
  const age = ageInYear(birthYear, isoDate);
  return categories.find((c) => age >= c.minAge && (c.maxAge === null || age <= c.maxAge))?.id ?? null;
}
