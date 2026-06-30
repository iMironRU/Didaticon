// ESLint 9 flat config.
//
// Accessibility — это инвариант ([[accessibility-policy]]). jsx-a11y правила = error
// (не warn), pre-commit hook режет коммит, CI gate режет PR.
//
// Источник правил: docs/accessibility/didakticon-accessibility.md §6.1
// + jsx-a11y/recommended как база.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import a11yPlugin from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  // Игнорируем сборки / node_modules / autogen
  {
    ignores: ["dist", "build", "node_modules", "dev-dist", "public/sw.js", "public/workbox-*.js"],
  },

  // Базовый JS/TS recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Основная конфигурация для React + a11y
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    plugins: {
      react:      reactPlugin,
      "react-hooks": hooksPlugin,
      "jsx-a11y": a11yPlugin,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType:  "module",
      globals: { ...globals.browser, ...globals.es2024 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React базовое
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",   // React 18 + new JSX transform
      "react/prop-types":         "off",   // TypeScript

      // jsx-a11y recommended + явные усиления
      ...a11yPlugin.configs.recommended.rules,
      "jsx-a11y/alt-text":                       "error",
      "jsx-a11y/anchor-has-content":             "error",
      "jsx-a11y/anchor-is-valid":                "error",
      "jsx-a11y/aria-props":                     "error",
      "jsx-a11y/aria-proptypes":                 "error",
      "jsx-a11y/aria-role":                      "error",
      "jsx-a11y/aria-unsupported-elements":      "error",
      // Этап Г (#27) закрыл: SlotCard'ы / ContextSwitcher / UnitScreen /
      // NotificationsScreen / GradebookTab переписаны на <button>.
      "jsx-a11y/click-events-have-key-events":   "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus":     "error",
      "jsx-a11y/label-has-associated-control":   "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/role-has-required-aria-props":   "error",
      "jsx-a11y/role-supports-aria-props":       "error",
      "jsx-a11y/tabindex-no-positive":           "error",

      // TypeScript послабления (для прагматичной разработки — fixup потом)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
