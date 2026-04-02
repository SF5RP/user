"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { allThemes, defaultTheme, type Theme } from "@/shared/lib/themes";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeName: string) => void;
  availableThemes: Record<string, Theme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [currentThemeName, setCurrentThemeName] = useState<string>("charcoal");

  // Загружаем сохраненную тему из localStorage при инициализации
  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme && allThemes[savedTheme]) {
      setCurrentThemeName(savedTheme);
    }
  }, []);

  const setTheme = (themeName: string) => {
    if (allThemes[themeName]) {
      setCurrentThemeName(themeName);
      localStorage.setItem("selectedTheme", themeName);
    }
  };

  const currentTheme = allThemes[currentThemeName] || defaultTheme;

  const emotionTheme = {
    colors: currentTheme.colors,
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    setTheme,
    availableThemes: allThemes,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <EmotionThemeProvider theme={emotionTheme}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
};


