"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const opt = (value: "light" | "dark" | "system", label: string) => (
    <Button
      key={value}
      size="sm"
      variant={theme === value ? "default" : "ghost"}
      onClick={() => setTheme(value)}
      aria-pressed={theme === value}
    >
      {label}
    </Button>
  );

  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Theme">
      {opt("light", "Light")}
      {opt("dark", "Dark")}
      {opt("system", "System")}
    </div>
  );
}

export default ThemeToggle;

