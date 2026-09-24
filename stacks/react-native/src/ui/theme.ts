// Design tokens — the only place colors/spacing/font sizes are defined.
// No inline hex or magic spacing numbers anywhere else.
export const theme = {
  colors: {
    bg: '#101014',
    surface: '#1C1C22',
    text: '#F2F2F7',
    textMuted: '#8E8E93',
    accent: '#4F8EF7',
    onAccent: '#FFFFFF',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
  font: { body: 16, title: 24 },
  radius: { md: 12 },
} as const;
