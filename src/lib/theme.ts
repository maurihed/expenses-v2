export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

/**
 * Resuelve el tema a aplicar. Una preferencia guardada explícita manda; si no
 * hay (o es inválida), se usa la preferencia del sistema operativo.
 */
export const resolveTheme = (stored: string | null, prefersDark: boolean): Theme => {
  if (stored === "dark") return "dark";
  if (stored === "light") return "light";
  return prefersDark ? "dark" : "light";
};

export const applyTheme = (theme: Theme, root: HTMLElement = document.documentElement) => {
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
};
