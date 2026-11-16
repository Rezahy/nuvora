"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // Avoid hydration mismatch — only render the real icon after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full",
        "transition-colors duration-150",
        "bg-[var(--sudoku-surface-hover)] hover:bg-[var(--sudoku-border-thin)]",
        "border border-[var(--sudoku-border-thin)]",
        className,
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {mounted ? (
        isDark ? (
          <Sun className="w-5 h-5 text-[var(--sudoku-text)]" />
        ) : (
          <Moon className="w-5 h-5 text-[var(--sudoku-text)]" />
        )
      ) : (
        // Placeholder to prevent layout shift before mount.
        <Sun className="w-5 h-5 text-[var(--sudoku-text)] opacity-0" />
      )}
    </motion.button>
  );
}
