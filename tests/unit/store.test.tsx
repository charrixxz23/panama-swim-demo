import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DataProvider, useData } from "../../src/hooks/useData";
import { validateResultsCsv } from "../../src/services/csv";
import { LocalStorageRepository, STORAGE_KEY } from "../../src/services/repository";
import { publicResults } from "../../src/services/queries";
import { ProgressChart } from "../../src/components/ProgressChart";

const wrapper = ({ children }: { children: ReactNode }) => <DataProvider repository={new LocalStorageRepository(window.localStorage)}>{children}</DataProvider>;

describe("persistencia local y flujo de publicación", () => {
  beforeEach(() => window.localStorage.clear());

  it("importa un CSV como pendiente, lo publica, persiste y se restaura", () => {
    const { result, unmount } = renderHook(() => useData(), { wrapper });
    const before = publicResults(result.current.data).length;
    const v = validateResultsCsv(readFileSync("public/samples/resultados-copa-azuero-demo.csv", "utf8"), result.current.data);
    let batchId = "";
    act(() => {
      batchId = result.current.importResults("ejemplo.csv", v).id;
    });
    // Pendiente: no es público todavía
    expect(publicResults(result.current.data).length).toBe(before);
    act(() => result.current.publishBatch(batchId));
    expect(publicResults(result.current.data).length).toBe(before + v.valid.length);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).importBatches[0].status).toBe("publicado");
    unmount();

    // Un proveedor nuevo (recarga) lee lo guardado
    const again = renderHook(() => useData(), { wrapper });
    expect(publicResults(again.result.current.data).length).toBe(before + v.valid.length);
    act(() => again.result.current.reset());
    expect(publicResults(again.result.current.data).length).toBe(before);
  });

  it("funciona sin almacenamiento disponible (modo privado)", () => {
    const { result } = renderHook(() => useData(), { wrapper: ({ children }) => <DataProvider repository={new LocalStorageRepository(null)}>{children}</DataProvider> });
    expect(result.current.persistent).toBe(false);
    expect(result.current.data.swimmers.length).toBeGreaterThan(0);
  });

  it("ignora datos guardados corruptos", () => {
    window.localStorage.setItem(STORAGE_KEY, "{roto");
    const { result } = renderHook(() => useData(), { wrapper });
    expect(result.current.data.competitions.length).toBeGreaterThan(0);
  });

  it("crear una competencia genera su programa de pruebas", () => {
    const { result } = renderHook(() => useData(), { wrapper });
    const base = result.current.data.competitions[0];
    act(() => result.current.saveCompetition({ ...base, id: "nueva-2027", name: "Nueva 2027", categories: ["9-10"], published: false }));
    const evs = result.current.data.events.filter((e) => e.competitionId === "nueva-2027");
    expect(evs).toHaveLength(10); // 5 pruebas × 2 ramas
    expect(evs.every((e) => e.categoryId === "9-10")).toBe(true);
  });
});

describe("gráfica de progreso", () => {
  // jsdom no implementa ResizeObserver (lo usa el contenedor adaptable de Recharts).
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  it("expone los datos en texto y avisa del eje invertido", () => {
    render(
      <MemoryRouter>
        <ProgressChart title="Progresión" points={[{ date: "2026-01-23", competition: "A", timeMs: 74200 }, { date: "2026-09-18", competition: "B", timeMs: 64800 }]} standardMs={62000} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("1:14.20");
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("1:04.80");
    expect(screen.getByText(/más arriba significa más rápido/)).toBeTruthy();
  });
});
