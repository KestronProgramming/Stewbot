// @ts-nocheck

import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["commands/disabled/**", "node_modules/**", "eslint.config.mjs" ]
    },
    // Base configuration for all files
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: {
            js,
            "@typescript-eslint": tseslint.plugin,
            "unused-imports": unusedImports,
            "@stylistic": stylistic
        },
        extends: [
            "js/recommended"
        ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node // Add Node.js globals for module.exports support
            }
        },
        rules: {
            // Extract and merge all tseslint recommended rules
            ...Object.fromEntries(
                (Array.isArray(tseslint.configs.recommendedTypeChecked)
                    ? tseslint.configs.recommendedTypeChecked
                    : [tseslint.configs.recommendedTypeChecked]
                )
                    .flatMap(config => Object.entries(config.rules || {}))
                    .map(([rule, config]) =>
                        [rule, Array.isArray(config) ? ["warn", ...config.slice(1)] : config === "error" ? "warn" : config]
                    )
            ),

            // Recommended JS configs, but downgrade errors to warnings - after tslint so they can override
            ...Object.fromEntries(
                Object.entries(js.configs.recommended.rules || {}).map(([rule, config]) => [rule, Array.isArray(config) ? ["warn", ...config.slice(1)] : config === "error" ? "warn" : config])
            ),


            // Actually important ts rules - will keep off for now but need to refractor to fix later - TODO
            "@typescript-eslint/no-floating-promises": "off",
            "prefer-const": "off",
            "no-var": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/unbound-method": "off",

            // Warn about checking truthiness of promises in JS files
            "@typescript-eslint/no-misused-promises": [
                "warn", {
                    "checksConditionals": true,
                    "checksVoidReturn": false
                }
            ],

            // Disable strict TypeScript rules that don't make sense for JS
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unused-vars": "off", // Handled by unused-imports plugin
            "@typescript-eslint/no-require-imports": "off",

            
            // Important rules
            "no-undef": "warn",
            "no-use-before-define": ["warn", { "functions": false, "classes": true, "variables": true }],
            "no-implicit-coercion": "warn",
            "no-shadow": ["warn", { "allow": ["_"] }],
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-new-func": "error",

            // Rules our codebase hasn't triggered, so I don't know if they are useful - disabled until I see them in action in our codebase
            // "no-redeclare": "error",
            // "no-undef-init": "error",
            // "no-self-compare": "error",
            // "no-unreachable-loop": "error",
            // "default-case-last": "error",
            // "no-fallthrough": "error",
            // "no-async-promise-executor": "error",
            // "no-unsafe-negation": "error",
            // "no-unused-private-class-members": "error",

            // Formatting rules
            "@stylistic/indent": ["warn", 4], // or 2, depending on your preference
            "@stylistic/brace-style": [
                "warn", "stroustrup", {  // else on new line
                    "allowSingleLine": true
                }
            ],

            "@stylistic/array-element-newline": [
                "warn", {
                    "ArrayExpression": "consistent"
                }
            ],
            // "@stylistic/array-bracket-newline": [
            //     "warn", {
            //         "multiline": true
            //     }
            // ],
            "@stylistic/function-call-argument-newline": ["warn", "consistent"],
            "@stylistic/quotes": [
                "warn", "double", {
                    "allowTemplateLiterals": "always",
                    "avoidEscape": true
                }
            ], // Double quotes
            "@stylistic/semi": ["warn", "always"], // Always use semicolons
            "@stylistic/comma-dangle": ["warn", "never"], // No trailing commas
            "@stylistic/object-curly-spacing": ["warn", "always"], // { foo: bar }
            "@stylistic/array-bracket-spacing": ["warn", "never"], // [1, 2, 3]
            "@stylistic/space-before-function-paren": [
                "warn", {
                    "anonymous": "never",
                    "named": "never",
                    "asyncArrow": "always"
                }
            ],
            "@stylistic/keyword-spacing": [
                "warn", {
                    "before": true,
                    "after": true
                }
            ], // if (condition)
            "@stylistic/space-unary-ops": [
                "warn", {
                    "words": true,
                    "nonwords": false,
                    "overrides": {
                        "typeof": false // tyepof(x)
                    }
                }
            ],
            "@stylistic/space-infix-ops": "warn", // a = b + c
            "@stylistic/no-trailing-spaces": "warn",
            "@stylistic/eol-last": ["warn", "always"],
            "@stylistic/no-multiple-empty-lines": ["warn", { "max": 2, "maxEOF": 0 }],
            "@stylistic/space-before-blocks": "warn", // if (x) {
            "@stylistic/arrow-spacing": ["warn", { "before": true, "after": true }], // () => {}
            "@stylistic/comma-spacing": ["warn", { "before": false, "after": true }],
            "@stylistic/key-spacing": ["warn", { "beforeColon": false, "afterColon": true }],
            "@stylistic/function-call-spacing": ["warn", "never"],

            // Member expression formatting (for chained calls)
            "@stylistic/dot-location": ["warn", "property"], // .setName() starts on new line
            "@stylistic/newline-per-chained-call": ["warn", { "ignoreChainWithDepth": 2 }], // Break chains after 2 calls

            // Fix catch lines
            "@stylistic/padding-line-between-statements": ["warn", { "blankLine": "never", "prev": "block", "next": "block-like" }]
        }
    },

    // JavaScript-specific configuration with TypeScript parser for better checking
    {
        files: ["**/*.js"],
        plugins: {},
        languageOptions: {
            sourceType: "commonjs",
            parser: tseslint.parser,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                // project: "./tsconfig.json",
                projectService: true,
            },
            globals: {
                ...globals.node, // Ensure Node.js globals for .js files
                "commands": "readonly",
                "cmds": "readonly",
                "client": "readonly",
                "bootedAt": "readonly",
                "config": "readonly",
                "daily": "readonly"
            }
        },
        rules: {
            // Unused imports rules
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn", {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_"
                }
            ],

            // Allow unused vars that start with _
            // "no-unused-vars": [
            //     "warn", {
            //         "vars": "all",
            //         "varsIgnorePattern": "^_",
            //         "args": "after-used",
            //         "argsIgnorePattern": "^_"
            //     }
            // ],
            "no-unused-vars": "off", // Already have one aboves

            // Allow empty catch blocks
            "no-empty": ["warn", { "allowEmptyCatch": true }],

            "no-redeclare": ["warn", { "builtinGlobals": false }],
            "no-case-declarations": "off"
        }
    }
]);
