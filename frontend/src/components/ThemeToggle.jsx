import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers/theme-provider";
import { Button } from "@/components/ui";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="secondary"
      size="sm"
      className="!w-9 !px-0 rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title="Toggle Theme"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
