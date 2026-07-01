import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                // Tampermonkey globals
                GM_xmlhttpRequest: "readonly",
                GM_setValue: "readonly",
                GM_getValue: "readonly",
                // Browser globals
                window: "readonly",
                document: "readonly",
                alert: "readonly",
                prompt: "readonly",
                setInterval: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
        },
    },
];
