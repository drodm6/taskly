import { useState, useEffect } from "react";
import { load, save } from "../utils/storage";

// =========================================================
// useTheme
//
// Toggles between "dark" (default) and "light" by adding or
// removing a .light class on <html>. Every component reads
// CSS variables, so nothing else has to know the theme exists.
//
// The choice persists to localStorage, and if the user has
// never chosen, we follow their OS preference.
// =========================================================

function getInitialTheme() {
  const stored = load("theme", null);
  if (stored === "light" || stored === "dark") return stored;

  // no stored choice — respect the device's own setting
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");

    // keeps the mobile browser chrome / OS status bar in sync
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#ffffff" : "#0a0a0a");

    save("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return { theme, setTheme, toggleTheme };
}