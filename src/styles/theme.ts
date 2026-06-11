// Coconut AI Design System & Branding
// Blends tropical coconut-water aesthetics with futuristic AI SaaS styling

export const colors = {
  // Primary - Coconut Water / Tropical Vibes
  primary: {
    50: '#f0f9f7',
    100: '#d4f0eb',
    200: '#a8e1d7',
    300: '#7dd2c3',
    400: '#52c3af',
    500: '#27b49b', // Main tropical teal
    600: '#1f8a7a',
    700: '#176059',
    800: '#0f3638',
    900: '#071d1a',
  },

  // Secondary - Coconut Brown / Warmth
  secondary: {
    50: '#fdfbf7',
    100: '#faf4eb',
    200: '#f3e5cd',
    300: '#ecd6af',
    400: '#e5c791',
    500: '#deb873', // Coconut brown
    600: '#c9985a',
    700: '#b27841',
    800: '#8a5a2f',
    900: '#623d1f',
  },

  // Accent - Electric AI Blue
  accent: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c1d3ff',
    300: '#a2bdff',
    400: '#83a7ff',
    500: '#6491ff', // Electric blue
    600: '#4573e6',
    700: '#2655cc',
    800: '#1a3aa6',
    900: '#0d1f80',
  },

  // Neutral - Premium Grays
  neutral: {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Gradients
  gradient: {
    tropical: 'linear-gradient(135deg, #27b49b 0%, #deb873 100%)',
    ai: 'linear-gradient(135deg, #6491ff 0%, #27b49b 100%)',
    premium: 'linear-gradient(135deg, #1f2937 0%, #27b49b 50%, #deb873 100%)',
  },
};

export const typography = {
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
    ],
    mono: ['"Fira Code"', '"JetBrains Mono"', '"Courier New"', 'monospace'],
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
};

export const borderRadius = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  premium: '0 20px 40px rgba(39, 180, 155, 0.15)',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};
