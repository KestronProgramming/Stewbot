import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    // Base configuration for all files
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node // Add Node.js globals for module.exports support
            }
        },
        rules: {
            // Convert all errors to warnings
            ...Object.fromEntries(
                Object.entries(js.configs.recommended.rules || {}).map(([rule, config]) => [
                    rule,
                    Array.isArray(config) ? ["warn", ...config.slice(1)] : config === "error" ? "warn" : config
                ])
            ),
            // Allow redeclaring variables in switch cases
            "no-redeclare": ["warn", { "builtinGlobals": false }],
            // Disable no-case-declarations rule
            "no-case-declarations": "off",
        }
    },

    // JavaScript-specific configuration with TypeScript parser for better checking
    {
        files: ["**/*.js"],
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        languageOptions: {
            sourceType: "commonjs",
            parser: tseslint.parser,
            parserOptions: {
                project: true, // Enable type-aware linting for JS files too
                allowAutomaticSingleRunInference: true,
            },
            globals: {
                ...globals.node // Ensure Node.js globals for .js files
            }
        },
        rules: {
            // Allow require() imports in JS files
            "@typescript-eslint/no-require-imports": "off",
            // Warn about checking truthiness of promises in JS files
            "@typescript-eslint/no-misused-promises": ["warn", {
                "checksConditionals": true,
                "checksVoidReturn": false
            }],
            // Disable strict TypeScript rules that don't make sense for JS
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
        }
    },

    // TypeScript-specific configuration
    {
        files: ["**/*.{ts,mts,cts}"],
        extends: [tseslint.configs.recommended],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: true, // Enable type-aware linting
            },
        },
        rules: {
            // Convert all TypeScript ESLint errors to warnings
            ...Object.fromEntries(
                Object.entries(tseslint.configs.recommended.rules || {}).map(([rule, config]) => [
                    rule,
                    Array.isArray(config) ? ["warn", ...config.slice(1)] : config === "error" ? "warn" : config
                ])
            ),
            // Allow require() imports
            "@typescript-eslint/no-require-imports": "off",
            // Disable the ts-ignore vs ts-expect-error rule
            "@typescript-eslint/ban-ts-comment": "off",
            // Warn about checking truthiness of promises (only for TypeScript files)
            "@typescript-eslint/no-misused-promises": ["warn", {
                "checksConditionals": true,
                "checksVoidReturn": false
            }],
        }
    }
]);