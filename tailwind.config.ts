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
        primary: {
          'light-bg': '#FFFFFF',
          'light-border': '#E0E2E4',
          'dark-bg': '#2E2C2D', 
          'dark-border': '#3A3A3C',
        },
        'connect-light-text': '#9D2A6D',
        'connect-dark-text': '#FFFFFF',
        'button-light-border': '#EBEBED',
        'button-dark-border': '#444446',
        'sidenav-light-text' :'#070912',
        'sidenav-dark-text' :'#FFFFFF',
        'sidenav-light-selected-bg': '#F9F2F6',
        'sidenav-dark-selected-bg': '#3A3A3C',
        'sidenav-light-selected-text': '#9D2A6D',
        'sidenav-dark-selected-text': '#FFFFFF'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Lusitana', 'ui-serif', 'Georgia'],
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config;
