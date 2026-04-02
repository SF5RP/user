import "@emotion/react";

declare module "@emotion/react" {
  export interface Theme {
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
}


