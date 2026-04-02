"use client";

import { Global, css } from "@emotion/react";

export const GlobalStyles = function () {
  return (
    <Global
      styles={css`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        html,
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        body {
          color: #e9ecef;
          background: #0f1115;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        a {
          color: #e9ecef;
          text-decoration: none;
        }
        
        button {
          font-family: inherit;
        }
      `}
    />
  );
};