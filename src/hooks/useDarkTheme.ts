import { useEffect, useState } from "react";

const isDarkTheme = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

/**
 * Devuelve si el tema oscuro está aplicado (clase `.dark` en <html>) y se
 * mantiene reactivo a los cambios de tema.
 */
export const useDarkTheme = () => {
  const [isDark, setIsDark] = useState(isDarkTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(isDarkTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    setIsDark(isDarkTheme());
    return () => observer.disconnect();
  }, []);

  return isDark;
};
