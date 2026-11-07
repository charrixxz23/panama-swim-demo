import { useEffect } from "react";

export function usePageMeta(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Panamá Swim (demo)` : "Panamá Swim | Cada segundo cuenta";
  }, [title]);
}
