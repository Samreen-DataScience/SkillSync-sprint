import { createContext, useContext, useEffect, useMemo, useState } from "react";

const initialState = {
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "skillsync-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );
  const [resolvedTheme, setResolvedTheme] = useState("light");

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const activeTheme = theme === "system"
        ? mediaQuery.matches ? "dark" : "light"
        : theme;

      root.classList.remove("light", "dark");
      root.classList.add(activeTheme);
      root.style.colorScheme = activeTheme;
      setResolvedTheme(activeTheme);
    };

    applyTheme();

    if (theme !== "system") return undefined;

    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  }), [resolvedTheme, storageKey, theme]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
