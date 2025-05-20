import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Все кастомные расширения темы удалены
      // Оставьте extend пустым или добавьте только то, что необходимо для базового Tailwind
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
