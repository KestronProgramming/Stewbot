import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    // Base configuration for all files
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { 
            js,
            "unused-imports": unusedImports
        },
        extends: ["js/recommended"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node, // Add Node.js globals for module.exports support
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
        },
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
                ...globals.node, // Ensure Node.js globals for .js files
                "commands": "readonly",
                "cmds": "readonly",
                "client": "readonly",
                "bootedAt": "readonly",
                "config": "readonly",
                "daily": "readonly",
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

            // Unused imports rules
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_"
                }
            ],

            "no-redeclare": ["warn", { "builtinGlobals": false }],
            "no-case-declarations": "off",
        }
    }
]);