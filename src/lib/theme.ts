import type { CSSProperties } from 'react';
import type { ThemeConfig } from 'antd';

// Nguồn token runtime duy nhất cho Ant Design và CSS/Tailwind.
export const tokens = {
  primary: '#0f766e',
  primaryHover: '#115e59',
  ink: '#17343b',
  muted: '#52676d',
  background: '#f3f6f5',
  surface: '#ffffff',
  border: '#ccd8d5',
  accent: '#e0eeea',
  scrollbar: '#78958e',
  scrollbarHover: '#526f68',
  font: "'Segoe UI', Arial, sans-serif",
  mono: "Consolas, 'Courier New', monospace",
  radius: 12,
  controlRadius: 8,
} as const;

export const themeVariables = {
  '--app-primary': tokens.primary,
  '--app-primary-hover': tokens.primaryHover,
  '--app-ink': tokens.ink,
  '--app-muted': tokens.muted,
  '--app-background': tokens.background,
  '--app-surface': tokens.surface,
  '--app-border': tokens.border,
  '--app-accent': tokens.accent,
  '--app-scrollbar': tokens.scrollbar,
  '--app-scrollbar-hover': tokens.scrollbarHover,
  '--app-font': tokens.font,
  '--app-mono': tokens.mono,
  '--app-radius': `${tokens.radius}px`,
  '--app-control-radius': `${tokens.controlRadius}px`,
} as CSSProperties;

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: tokens.primary,
    colorPrimaryHover: tokens.primaryHover,
    colorText: tokens.ink,
    colorTextSecondary: tokens.muted,
    colorBgContainer: tokens.surface,
    colorBorder: tokens.border,
    fontFamily: tokens.font,
    fontSize: 16,
    borderRadius: tokens.controlRadius,
    controlHeight: 44,
  },
};
