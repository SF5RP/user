// Flat ESLint config for ESLint v9+ with TypeScript
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files-new
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // Ignore build artifacts and deps
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "next-env.d.ts",
      "next.config.js",
      "eslint.config.mjs",
    ],
  },

  // JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (type-aware)
  ...tseslint.configs.recommendedTypeChecked,

  // Project-specific settings and tweaks
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Allow console.warn and console.error for surfacing issues in dev
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true, ignoreIIFE: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
