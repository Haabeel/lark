import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Shadcn colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        //Website colors
        foundation: {
          purple: {
            50: "#f7eefc",
            100: "#e5c9f6",
            200: "#d8aff2",
            300: "#c78aec",
            400: "#bc74e9",
            500: "#ab51e3",
            600: "#9c4acf",
            700: "#793aa1",
            800: "#5e2d7d",
            900: "#48225f",
          },
          neutral: {
            50: "#f4f4f5",
            100: "#dddedf",
            200: "#ccced0",
            300: "#b5b7bb",
            400: "#a6a9ad",
            500: "#909499",
            600: "#83878b",
            700: "#66696d",
            800: "#4f5154",
            900: "#3c3e40",
          },
          blue: {
            50: "#e9eaec",
            100: "#babec4",
            200: "#999ea7",
            300: "#6a727f",
            400: "#4d5766",
            500: "#212d40",
            600: "#1e293a",
            700: "#17202d",
            800: "#121923",
            900: "#0e131b",
          },
          green: {
            50: "#ebf7e6",
            100: "#c1e7b0",
            200: "#a3db8a",
            300: "#7aca54",
            400: "#60c033",
            500: "#38b000",
            600: "#33a000",
            700: "#287d00",
            800: "#1f6100",
            900: "#184a00",
          },
          red: {
            50: "#f6e9eb",
            100: "#e4b9c0",
            200: "#d798a2",
            300: "#c46877",
            400: "#b94b5d",
            500: "#a71e34",
            600: "#981b2f",
            700: "#771525",
            800: "#5c111d",
            900: "#460d16",
          },
          orange: {
            50: "#fff7e6",
            100: "#ffe5b0",
            200: "#ffd88a",
            300: "#ffc654",
            400: "#ffbb33",
            500: "#ffaa00",
            600: "#e89b00",
            700: "#b57900",
            800: "#8c5e00",
            900: "#6b4700",
          },
        },
        brand: {
          purple: {
            50: "#f7e9fa",
            100: "#e6baef",
            200: "#da99e7",
            300: "#c96adb",
            400: "#be4dd5",
            500: "#ae21ca",
            600: "#9e1eb8",
            700: "#7c178f",
            800: "#60126f",
            900: "#490e55",
          },
          blue: {
            50: "#e8e9f7",
            100: "#b9bae7",
            200: "#9799db",
            300: "#676aca",
            400: "#494dc0",
            500: "#1c21b0",
            600: "#191ea0",
            700: "#14177d",
            800: "#0f1261",
            900: "#0c0e4a",
          },
        },
      },
      fontSize: {
        xs: "14px", // 0
        sm: "16px", // 1
        base: "18px", // 2
        lg: "20px", // 3
        xl: "24px", // 4
        "2xl": "30px", // 5
        "3xl": "36px", // 6
        "4xl": "48px", // 7
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
