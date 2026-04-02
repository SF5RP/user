import { useTheme } from "@/shared/contexts/themeContext";
import { useMemo } from "react";

export const useThemeColors = () => {
  const { currentTheme } = useTheme();
  
  return useMemo(() => currentTheme.colors, [currentTheme]);
};

export const useThemeSwitcher = () => {
  const { setTheme, availableThemes, currentTheme } = useTheme();
  
  const switchToTheme = (themeName: string) => {
    setTheme(themeName);
  };
  
  const getThemeNames = () => {
    return Object.keys(availableThemes);
  };
  
  const isDarkTheme = () => {
    return currentTheme.name !== "Light";
  };
  
  return {
    switchToTheme,
    getThemeNames,
    isDarkTheme,
    currentThemeName: currentTheme.name,
    availableThemes,
  };
};


