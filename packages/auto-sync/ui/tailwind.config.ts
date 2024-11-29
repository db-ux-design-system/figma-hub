import type { Config } from "tailwindcss";
import { CustomThemeConfig } from "tailwindcss/types/config";
// @ts-ignore
import tokens from "@db-ui/foundations/build/tailwind/tailwind-tokens.json";
const customThemeConfig: CustomThemeConfig = tokens as any;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    ...customThemeConfig,
    gap: ({ theme }) => ({
      ...theme("spacing"),
    }),
    space: ({ theme }) => ({
      ...theme("spacing"),
    }),
  },
  plugins: [],
} satisfies Config;
