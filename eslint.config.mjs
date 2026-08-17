import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/**", ".next/**", "public/uploads/**"],
  },
  {
    rules: {
      // Prisma/OpenAI payloads and DTO pass-through objects are intentionally
      // loosely typed in several places; keep this a warning, not a build-breaker.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
