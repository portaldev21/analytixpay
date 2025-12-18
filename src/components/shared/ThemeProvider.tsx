"use client";

import * as React from "react";

/**
 * ThemeProvider - Simplified for dark-mode-only app
 *
 * This provider maintains the context structure for backwards compatibility
 * but always uses dark mode. No theme switching needed.
 */

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: "dark";
};

const initialState: ThemeProviderState = {
  theme: "dark",
};

const ThemeProviderContext =
  React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeProviderContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
