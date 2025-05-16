// This hook checks if the user's system preference is set to dark mode.
export const useDarkTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};
