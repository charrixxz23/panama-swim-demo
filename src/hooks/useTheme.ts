import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "panama-swim:tema";

const initial = (): Theme => {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* sin almacenamiento */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#07182f" : "#ffffff");
  }, [theme]);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(KEY, next);
      } catch {
        /* sin almacenamiento */
      }
      return next;
    });
  }, []);
  return { theme, toggle };
}
