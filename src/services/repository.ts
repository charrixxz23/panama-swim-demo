import type { Dataset } from "../models";
import seed from "../data/demo-dataset.json";

/**
 * Persistencia del MVP. La interfaz permite cambiar el almacenamiento local por una API con
 * PostgreSQL sin tocar las pantallas (ver docs/arquitectura.md).
 */
export interface DataRepository {
  load(): { data: Dataset; persisted: boolean; restoredFromSeed: boolean };
  save(data: Dataset): boolean;
  reset(): Dataset;
}

export const STORAGE_KEY = "panama-swim:datos:v1";

export const seedDataset = (): Dataset => structuredClone(seed as Dataset);

export class LocalStorageRepository implements DataRepository {
  constructor(private readonly storage: Storage | null = typeof window !== "undefined" ? safeStorage() : null) {}

  load() {
    if (!this.storage) return { data: seedDataset(), persisted: false, restoredFromSeed: true };
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Dataset;
        if (parsed && parsed.version === (seed as Dataset).version && Array.isArray(parsed.results))
          return { data: parsed, persisted: true, restoredFromSeed: false };
      }
    } catch {
      /* datos corruptos: se vuelve a los demostrativos */
    }
    return { data: seedDataset(), persisted: true, restoredFromSeed: true };
  }

  save(data: Dataset) {
    if (!this.storage) return false;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento */
    }
    return seedDataset();
  }
}

function safeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    const k = "__ps_test__";
    s.setItem(k, "1");
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}
