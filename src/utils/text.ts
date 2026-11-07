export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const matchesAll = (haystack: string, query: string) => {
  const terms = normalize(query).split(" ").filter(Boolean);
  const h = normalize(haystack);
  return terms.every((t) => h.includes(t));
};

export const slugify = (s: string) =>
  normalize(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
