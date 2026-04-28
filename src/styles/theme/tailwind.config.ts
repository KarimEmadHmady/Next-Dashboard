// src/styles/theme/tailwind.config.ts 

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        boven2: ['BOVEN2', 'sans-serif'],
        boven3: ['BOVEN3', 'sans-serif'],
        mishafi: ['MishafiGold', 'sans-serif'],
        cairo: ['var(--font-cairo)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },

      colors: {
        // 🧠 سيب دول زي ما هم (system colors)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // ✅ ألوانك الأساسية
        primary: '#121f48',     // كحلي
        secondary: '#66c7c7 !important',   // تيل
        offwhite: '#e8e8e8',
        white: '#ffffff',
        black: '#000000',

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // 🔥 palette احترافي
        brand: {
          50:  "#f2f6fb",
          100: "#d9e4f5",
          200: "#b3c9eb",
          300: "#8daee0",
          400: "#5f8fd1",
          500: "#66c7c7", // teal
          600: "#4aaeb0",
          700: "#3a8c95",
          800: "#2a6b73",
          900: "#121f48", // navy
          950: "#0a122b",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}