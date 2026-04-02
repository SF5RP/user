export interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    surfaceSecondary: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
    primaryHover: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const darkThemes: Record<string, Theme> = {
  midnight: {
    name: "Midnight",
    colors: {
      background: "#0a0a0a",
      surface: "#1a1a1a",
      surfaceSecondary: "#2a2a2a",
      border: "rgba(255, 255, 255, 0.1)",
      text: "#ffffff",
      textSecondary: "#a0a0a0",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      accent: "#8b5cf6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
  charcoal: {
    name: "Charcoal",
    colors: {
      background: "#0f1419",
      surface: "#1a1f2e",
      surfaceSecondary: "#252b3b",
      border: "rgba(255, 255, 255, 0.08)",
      text: "#e9ecef",
      textSecondary: "#94a3b8",
      primary: "#5562e0",
      primaryHover: "#4853c8",
      accent: "#3b82f6",
      success: "#22c55e",
      warning: "#fbbf24",
      error: "#ef4444",
    },
  },
  obsidian: {
    name: "Obsidian",
    colors: {
      background: "#000000",
      surface: "#111111",
      surfaceSecondary: "#1e1e1e",
      border: "rgba(255, 255, 255, 0.05)",
      text: "#ffffff",
      textSecondary: "#888888",
      primary: "#6366f1",
      primaryHover: "#4f46e5",
      accent: "#8b5cf6",
      success: "#059669",
      warning: "#d97706",
      error: "#dc2626",
    },
  },
  deepSpace: {
    name: "Deep Space",
    colors: {
      background: "#0c0c0c",
      surface: "#1a1a2e",
      surfaceSecondary: "#16213e",
      border: "rgba(255, 255, 255, 0.06)",
      text: "#e0e6ed",
      textSecondary: "#7c8db0",
      primary: "#4f46e5",
      primaryHover: "#4338ca",
      accent: "#06b6d4",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#f87171",
    },
  },
};

export const lightThemes: Record<string, Theme> = {
  light: {
    name: "Light",
    colors: {
      background: "#ffffff",
      surface: "#f8fafc",
      surfaceSecondary: "#f1f5f9",
      border: "rgba(0, 0, 0, 0.1)",
      text: "#1e293b",
      textSecondary: "#64748b",
      primary: "#3b82f6",
      primaryHover: "#2563eb",
      accent: "#8b5cf6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  },
};

export const allThemes = { ...darkThemes, ...lightThemes };

export const defaultTheme = darkThemes.charcoal;


