import type { Config } from 'tailwindcss'
import tailwindForms from '@tailwindcss/forms'
import { join } from 'path';

const config: Config = {
  darkMode: 'class',

  content: [
    join(__dirname, './app/**/*.{js,ts,jsx,tsx}'),
  ],

  theme: {
    extend: {
      
      colors: {

        'light-bg': '#FFFFFF',
        'dark-bg': '#2E2C2D',
        'light-text': '#070912',
        'dark-text': '#FFFFFF',
        'light-border': '#E0E2E4',
        'dark-border': '#3A3A3C',

        'connect-light-text-wallet': '#FFFFFF',
        'connect-dark-text': '#FFFFFF',
        'connect-light-text': '#9D2A6D',

        'button-light-border': '#EBEBED',
        'button-dark-border': '#444446',

        'sidenav-light-text': '#070912',
        'sidenav-dark-text': '#FFFFFF',

        'light-selected-bg': '#F9F2F6',
        'dark-selected-bg': '#3A3A3C',
        'light-selected-text': '#9D2A6D',
        'dark-selected-text': '#FFFFFF',

        'content-light-bg': '#EAECEE',
        'content-dark-bg': '#000000',

        'title-light-color': '#B6B6B7',
        'title-dark-color': '#B6B6B7',

        'line-light-bg': '#E0E2E4',
        'line-dark-bg': '#5B5B5E',

        primary: { 
            50: '#f5f3ff', 
            100: '#ede9fe', 
            200: '#ddd6fe', 
            300: '#c4b5fd', 
            400: '#a78bfa', 
            500: '#9F7AEA', 
            600: '#763EF0', 
            700: '#553C9A', 
            800: '#4c1d95', 
            900: '#1e1b4b' 
        },
        accent: { 
            50: '#eff6ff', 
            100: '#dbeafe', 
            200: '#bfdbfe', 
            300: '#93c5fd', 
            400: '#60a5fa', 
            500: '#2E6BE6', 
            600: '#2563eb', 
            700: '#1d4ed8', 
            800: '#1e40af', 
            900: '#1e3a8a' 
        },
        success: { 
            50: '#ecfdf5', 
            100: '#d1fae5', 
            200: '#a7f3d0', 
            300: '#6ee7b7', 
            400: '#34d399', 
            500: '#29C68C', 
            600: '#059669', 
            700: '#047857', 
            800: '#065f46', 
            900: '#064e3b' 
        },
        neutral: {
            20: '#D7DBE2',
            70: '#8B94A5'
        },
        surface: {
            DEFAULT: '#f8fafc',
            muted: '#f1f5f9'
        },
        verana: { 
            50: '#f5f3ff', 
            100: '#ede9fe', 
            200: '#ddd6fe', 
            300: '#c4b5fd', 
            400: '#a78bfa', 
            500: '#9F7AEA', 
            600: '#763EF0', 
            700: '#553C9A', 
            800: '#4c1d95', 
            900: '#1e1b4b' 
        }
      },
      lineHeight: {
        'extra-tight': '0.9',  // << leading-none
      },
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      spacing: { 
          '18': '4.5rem', 
          '88': '22rem', 
          '128': '32rem' 
      },
      borderRadius: {
          'lg': '16px',
          'md': '12px', 
          'sm': '8px'
      },
      boxShadow: {
          'focus': '0 0 0 3px rgba(118, 62, 240, 0.35)'
      },
      keyframes: {
        skeleton: {
          '0%': { opacity: '1' },
          '100%': { opacity: '.4' }
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' }
        }
      },
      animation: {
        skeleton: 'skeleton 1s linear infinite alternate',
        pulseRing: 'pulseRing 2s ease-out infinite'
      }
    }

  },  

  plugins: [tailwindForms]
}

export default config;
