import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors can be added here
        // Examples:
        // primary: '#your-color',
        // secondary: '#your-color',
      },
      spacing: {
        // Custom spacing values can be added here
      },
      borderRadius: {
        // Custom border radius values
      },
      fontFamily: {
        // Custom font families
      },
      fontSize: {
        // Custom font sizes
      },
      lineHeight: {
        // Custom line heights
      },
      letterSpacing: {
        // Custom letter spacing
      },
      boxShadow: {
        // Custom shadows
      },
      animation: {
        // Custom animations
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable class-based dark mode
};

export default config;
