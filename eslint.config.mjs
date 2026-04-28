import withNuxt from "./.nuxt/eslint.config.mjs";
import pluginTs from "@typescript-eslint/eslint-plugin";

export default withNuxt(
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts", "**/*.vue"],
    plugins: { "@typescript-eslint": pluginTs },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
