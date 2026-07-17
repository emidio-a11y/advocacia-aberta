export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const STOPWORDS = new Set([
  "a", "o", "e", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "sem", "que", "se", "ou", "um", "uma", "uns", "umas",
  "ao", "aos", "pelo", "pela", "pelos", "pelas", "este", "esta", "esse", "essa",
  "seu", "sua", "seus", "suas", "como", "mais", "qual", "quais", "sobre", "sob",
  "entre", "ser", "ter", "haver", "fazer", "poder", "dever", "apos",
]);

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}
