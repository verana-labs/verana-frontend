import type { Config } from 'tailwindcss'
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
        'connect-light-text': '#9D2A6D',
        'connect-dark-text': '#FFFFFF',
        'button-light-border': '#EBEBED',
        'button-dark-border': '#444446',
        'sidenav-light-text' :'#070912',
        'sidenav-dark-text' :'#FFFFFF',
        'light-selected-bg': '#F9F2F6',
        'dark-selected-bg': '#3A3A3C',
        'light-selected-text': '#9D2A6D',
        'dark-selected-text': '#FFFFFF',
        'content-light-bg': '#EAECEE',
        'content-dark-bg': '#000000',
        'title-light-color': '#B6B6B7',
        'title-dark-color': '#B6B6B7',
        'line-light-bg' : '#E0E2E4',
        'line-dark-bg' : '#5B5B5E'
      },
      fontFamily: {
        sans: ['var(--font-kantumruy)', 'ui-sans-serif', 'system-ui'],
        serif: ['Lusitana', 'ui-serif', 'Georgia'],
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config;
