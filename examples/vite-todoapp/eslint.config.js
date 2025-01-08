import eslint from "@eslint/js";
import react from "eslint-plugin-react";
import tsEslint from "typescript-eslint";

export default tsEslint.config({
  files: ["**/*.{ts,tsx}"],
  extends: [eslint.configs.recommended, ...tsEslint.configs.recommended],
  languageOptions: {
    parser: tsEslint.parser,
  },
  plugins: {
    react,
  },
  rules: {
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-empty-object-type": "off",
  },
});
