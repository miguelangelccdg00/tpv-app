/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'blob': 'blob 12s infinite ease-in-out',
        'blob-slow': 'blob-slow 20s infinite ease-in-out',
        'float': 'float 8s infinite ease-in-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
          },
          '25%': {
            transform: 'translate(40px, -60px) scale(1.1) rotate(90deg)',
          },
          '50%': {
            transform: 'translate(-40px, 40px) scale(0.9) rotate(180deg)',
          },
          '75%': {
            transform: 'translate(60px, 20px) scale(1.05) rotate(270deg)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1) rotate(360deg)',
          },
        },
        'blob-slow': {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(-50px, -30px) scale(1.2)',
          },
          '66%': {
            transform: 'translate(30px, 50px) scale(0.8)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        float: {
          '0%': {
            transform: 'translateY(0px) translateX(0px)',
          },
          '33%': {
            transform: 'translateY(-20px) translateX(10px)',
          },
          '66%': {
            transform: 'translateY(10px) translateX(-10px)',
          },
          '100%': {
            transform: 'translateY(0px) translateX(0px)',
          },
        },
        'fade-in-up': {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
};
