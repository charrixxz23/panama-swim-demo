import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { buildEvents } from "../data/templates";
import type { Competition, Dataset, ImportBatch, QualifyingStandard, Result, Swimmer } from "../models";
import type { CsvValidation } from "../services/csv";
import { indexes, type Indexes } from "../services/queries";
import { LocalStorageRepository, type DataRepository } from "../services/repository";

interface DataApi {
  data: Dataset;
  ix: Indexes;
  /** false si el navegador no permite guardar (modo privado, almacenamiento bloqueado). */
  persistent: boolean;
  saveCompetition: (c: Competition) => void;
  setCompetitionPublished: (id: string, published: boolean) => void;
  importResults: (fileName: string, validation: CsvValidation) => ImportBatch;
  publishBatch: (id: string) => void;
  discardBatch: (id: string) => void;
  saveStandard: (s: QualifyingStandard) => void;
  deleteStandard: (id: string) => void;
  saveSwimmer: (s: Swimmer) => void;
  reset: () => void;
}

const DataContext = createContext<DataApi | null>(null);

export function DataProvider({ children, repository }: { children: ReactNode; repository?: DataRepository }) {
  const repo = useRef(repository ?? new LocalStorageRepository()).current;
  const [initial] = useState(() => repo.load());
  const [data, setData] = useState<Dataset>(initial.data);
  const [persistent, setPersistent] = useState(initial.persisted);

  const commit = useCallback(
    (fn: (d: Dataset) => Dataset) =>
      setData((prev) => {
        const next = fn(prev);
        setPersistent(repo.save(next));
        return next;
      }),
    [repo],
  );

  const api = useMemo<DataApi>(
    () => ({
      data,
      ix: indexes(data),
      persistent,
      saveCompetition: (c) =>
        commit((d) => {
          const exists = d.competitions.some((x) => x.id === c.id);
          const hasResults = d.results.some((r) => r.competitionId === c.id);
          // Las pruebas se regeneran desde las categorías solo si la competencia aún no tiene resultados.
          const events = hasResults ? d.events : [...d.events.filter((e) => e.competitionId !== c.id), ...buildEvents(c)];
          return { ...d, competitions: exists ? d.competitions.map((x) => (x.id === c.id ? c : x)) : [...d.competitions, c], events };
        }),
      setCompetitionPublished: (id, published) =>
        commit((d) => ({ ...d, competitions: d.competitions.map((c) => (c.id === id ? { ...c, published } : c)) })),
      importResults: (fileName, v) => {
        const batch: ImportBatch = {
          id: `lote-${Date.now().toString(36)}`,
          fileName,
          createdAt: new Date().toISOString(),
          competitionIds: [...new Set(v.valid.map((r) => r.competitionId))],
          rows: v.valid.length,
          status: "pendiente",
        };
        const rows: Result[] = v.valid.map((r) => ({ ...r, id: `${r.eventId}-${r.swimmerId}`, importBatchId: batch.id, published: false }));
        commit((d) => ({ ...d, results: [...d.results, ...rows], importBatches: [batch, ...d.importBatches] }));
        return batch;
      },
      publishBatch: (id) =>
        commit((d) => ({
          ...d,
          results: d.results.map((r) => (r.importBatchId === id ? { ...r, published: true } : r)),
          importBatches: d.importBatches.map((b) => (b.id === id ? { ...b, status: "publicado" } : b)),
        })),
      discardBatch: (id) =>
        commit((d) => ({
          ...d,
          results: d.results.filter((r) => r.importBatchId !== id),
          importBatches: d.importBatches.map((b) => (b.id === id ? { ...b, status: "descartado" } : b)),
        })),
      saveStandard: (s) =>
        commit((d) => ({ ...d, standards: d.standards.some((x) => x.id === s.id) ? d.standards.map((x) => (x.id === s.id ? s : x)) : [...d.standards, s] })),
      deleteStandard: (id) => commit((d) => ({ ...d, standards: d.standards.filter((s) => s.id !== id) })),
      saveSwimmer: (s) =>
        commit((d) => ({ ...d, swimmers: d.swimmers.some((x) => x.id === s.id) ? d.swimmers.map((x) => (x.id === s.id ? s : x)) : [...d.swimmers, s] })),
      reset: () => {
        const fresh = repo.reset();
        setData(fresh);
        setPersistent(repo.save(fresh));
      },
    }),
    [data, persistent, commit, repo],
  );

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
