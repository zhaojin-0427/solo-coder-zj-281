/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7BA17B',
          light: '#9CC09C',
          dark: '#5A7D5A',
        },
        secondary: {
          lavender: '#B8A9C9',
          'lavender-light': '#D4CAE0',
          apricot: '#F5D0A9',
          'apricot-light': '#FAE8D0',
        },
        bg: {
          DEFAULT: '#FAF8F5',
          soft: '#F5F2ED',
          card: '#FFFFFF',
        },
        text: {
          DEFAULT: '#2D3A2D',
          soft: '#5A6B5A',
          muted: '#8A9A8A',
        },
        border: {
          DEFAULT: '#E5E2DC',
        },
        success: '#7BA17B',
        warning: '#E5A96B',
        error: '#D47575',
        info: '#8AA9C9',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Noto Sans',
          'Helvetica',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(45, 58, 45, 0.06)',
        md: '0 4px 12px rgba(45, 58, 45, 0.08)',
        lg: '0 8px 24px rgba(45, 58, 45, 0.1)',
        xl: '0 16px 48px rgba(45, 58, 45, 0.12)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-in-up': 'fadeInUp 0.25s ease-out',
        'fade-in-down': 'fadeInDown 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
