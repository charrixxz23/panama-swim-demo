import { describe, expect, it } from "vitest";
import { formatDelta, formatSeconds, formatTime, parseTime, TimeFormatError, tryParseTime } from "../../src/utils/time";

describe("parseTime", () => {
  it("convierte minutos, segundos y centésimas a milisegundos enteros", () => {
    expect(parseTime("1:04.80")).toBe(64800);
    expect(parseTime("1:14.20")).toBe(74200);
    expect(parseTime("58.31")).toBe(58310);
    expect(parseTime("2:17.20")).toBe(137200);
    expect(parseTime("16:02.45")).toBe(962450);
  });
  it("acepta coma decimal y una sola cifra decimal como décimas", () => {
    expect(parseTime("1:04,80")).toBe(64800);
    expect(parseTime("1:04.8")).toBe(64800);
    expect(parseTime(" 29.9 ")).toBe(29900);
  });
  it("no confunde segundos con minutos", () => {
    expect(parseTime("64.80")).toBe(64800);
    expect(parseTime("1:04.80")).toBe(parseTime("64.80"));
  });
  it("rechaza formatos inválidos", () => {
    for (const bad of ["", "1:75.20", "1:4.80", "abc", "1:04", "1.04.80", "-1:04.80", "0.00", "1:04.805"]) {
      expect(() => parseTime(bad), bad).toThrow(TimeFormatError);
    }
    expect(tryParseTime("x")).toBeNull();
  });
  it("produce siempre enteros (sin errores de coma flotante)", () => {
    for (let cs = 1; cs < 20000; cs += 37) {
      const ms = parseTime(formatTime(cs * 10));
      expect(Number.isInteger(ms)).toBe(true);
      expect(ms).toBe(cs * 10);
    }
  });
});

describe("formato", () => {
  it("formatea con o sin minutos", () => {
    expect(formatTime(64800)).toBe("1:04.80");
    expect(formatTime(58310)).toBe("58.31");
    expect(formatTime(5000)).toBe("5.00");
    expect(formatTime(600000)).toBe("10:00.00");
  });
  it("muestra diferencias con signo y segundos absolutos", () => {
    expect(formatDelta(2800)).toBe("+2.80");
    expect(formatDelta(-420)).toBe("−0.42");
    expect(formatDelta(0)).toBe("0.00");
    expect(formatSeconds(-2800)).toBe("2.80");
    expect(formatSeconds(61230)).toBe("61.23");
  });
});
