import { todayISO } from "../utils/dates";

/** Fecha de hoy en Panamá (fijable en pruebas con window.__PS_TODAY__). */
export const useToday = () => todayISO();
