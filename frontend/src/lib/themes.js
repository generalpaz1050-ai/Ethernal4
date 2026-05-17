// Theme system for Ethernal - sets CSS variables on root

export const themes = {
  medievalWarm: {
    name: 'Medieval Cálido',
    colors: {
      background: '#1a0f08',
      foreground: '#f5e6d3',
      card: '#2d1a10',
      cardForeground: '#f5e6d3',
      primary: '#d4a574',
      primaryForeground: '#1a0f08',
      secondary: '#3d2415',
      secondaryForeground: '#f5e6d3',
      muted: '#4a2f1d',
      mutedForeground: '#c9b299',
      accent: '#c9a961',
      accentForeground: '#1a0f08',
      border: '#5a3a24',
      input: '#2d1a10',
      ring: '#d4a574',
      glow: 'rgba(212, 165, 116, 0.5)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #d4a574 0%, #c9a961 50%, #8b6539 100%)',
      dark: 'linear-gradient(135deg, #1a0f08 0%, #2d1a10 50%, #3d2415 100%)',
    },
  },
  darkMinimalist: {
    name: 'Minimalista Oscuro',
    colors: {
      background: '#0f0f0f',
      foreground: '#f8f8f8',
      card: '#1a1a1a',
      cardForeground: '#f8f8f8',
      primary: '#e5e5e5',
      primaryForeground: '#0f0f0f',
      secondary: '#262626',
      secondaryForeground: '#f8f8f8',
      muted: '#333333',
      mutedForeground: '#b8b8b8',
      accent: '#f8f8f8',
      accentForeground: '#0f0f0f',
      border: '#404040',
      input: '#1a1a1a',
      ring: '#ffffff',
      glow: 'rgba(255, 255, 255, 0.3)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #d4d4d4 0%, #a3a3a3 100%)',
      dark: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #262626 100%)',
    },
  },
  primavera: {
    name: 'Primavera',
    colors: {
      background: '#0d1f15',
      foreground: '#d4f4dd',
      card: '#142b1f',
      cardForeground: '#d4f4dd',
      primary: '#34d399',
      primaryForeground: '#0d1f15',
      secondary: '#1a3a2a',
      secondaryForeground: '#d4f4dd',
      muted: '#1f4d35',
      mutedForeground: '#a7e7bf',
      accent: '#f472b6',
      accentForeground: '#0d1f15',
      border: '#2d5a42',
      input: '#142b1f',
      ring: '#34d399',
      glow: 'rgba(52, 211, 153, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
      dark: 'linear-gradient(135deg, #0d1f15 0%, #142b1f 50%, #1a3a2a 100%)',
    },
  },
  darkFantasy: {
    name: 'Fantasía Oscura',
    colors: {
      background: '#0a0412',
      foreground: '#ede9fe',
      card: '#1a0f2e',
      cardForeground: '#ede9fe',
      primary: '#a78bfa',
      primaryForeground: '#0a0412',
      secondary: '#2d1b4e',
      secondaryForeground: '#ede9fe',
      muted: '#3d2766',
      mutedForeground: '#c4b5fd',
      accent: '#fbbf24',
      accentForeground: '#0a0412',
      border: '#4c3575',
      input: '#1a0f2e',
      ring: '#a78bfa',
      glow: 'rgba(167, 139, 250, 0.45)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)',
      dark: 'linear-gradient(135deg, #0a0412 0%, #1a0f2e 50%, #2d1b4e 100%)',
    },
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      background: '#050008',
      foreground: '#e6fffa',
      card: '#0d0014',
      cardForeground: '#e6fffa',
      primary: '#ff2d8a',
      primaryForeground: '#ffffff',
      secondary: '#140025',
      secondaryForeground: '#00fff9',
      muted: '#1f0033',
      mutedForeground: '#9ffcf7',
      accent: '#00fff9',
      accentForeground: '#050008',
      border: '#3d1066',
      input: '#0d0014',
      ring: '#ff2d8a',
      glow: 'rgba(255, 45, 138, 0.55)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #ff2d8a 0%, #d946ef 50%, #00fff9 100%)',
      dark: 'linear-gradient(135deg, #050008 0%, #0d0014 50%, #140025 100%)',
    },
  },
  warmRomance: {
    name: 'Romance Cálido',
    colors: {
      background: '#1a0b0e',
      foreground: '#ffe4e9',
      card: '#2d1418',
      cardForeground: '#ffe4e9',
      primary: '#fb7185',
      primaryForeground: '#1a0b0e',
      secondary: '#3d1d24',
      secondaryForeground: '#ffe4e9',
      muted: '#4d2630',
      mutedForeground: '#fecdd6',
      accent: '#fbbf24',
      accentForeground: '#1a0b0e',
      border: '#5d2f3c',
      input: '#2d1418',
      ring: '#fb7185',
      glow: 'rgba(251, 113, 133, 0.45)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #e11d48 100%)',
      dark: 'linear-gradient(135deg, #1a0b0e 0%, #2d1418 50%, #3d1d24 100%)',
    },
  },
};

function kebabCase(s) {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function applyTheme(themeName) {
  const theme = themes[themeName] || themes.medievalWarm;
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${kebabCase(key)}`, value);
  });
  root.style.setProperty('--gradient-primary', theme.gradients.primary);
  root.style.setProperty('--gradient-dark', theme.gradients.dark);
  // Expose the active theme on <body> so the AnimatedBackground component
  // (and any CSS selectors) can react to theme changes.
  if (typeof document !== 'undefined' && document.body) {
    document.body.setAttribute('data-theme', themeName);
  }
  localStorage.setItem('ethernal-theme', themeName);
}

export function getSavedTheme() {
  return localStorage.getItem('ethernal-theme') || 'medievalWarm';
}
