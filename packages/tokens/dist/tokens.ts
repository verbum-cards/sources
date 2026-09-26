// Сгенерировано из tokens.json. Не править вручную: npm run tokens.
export const light = {
  "paper": "#f5f3ee",
  "surface": "#ffffff",
  "surfaceSunken": "#ece9e2",
  "line": "#dedad0",
  "lineStrong": "#8f8a7e",
  "ink": "#15140f",
  "inkMuted": "#5c584f",
  "action": "#15140f",
  "onAction": "#f5f3ee",
  "highlight": "#d4f24a",
  "onHighlight": "#15140f",
  "highlightSoft": "#eef8c4",
  "panel": "#15140f",
  "onPanel": "#f5f3ee",
  "panelMuted": "#b8b4a8",
  "signal": "#ff6b2c",
  "onSignal": "#15140f",
  "signalInk": "#b23c0b",
  "signalSoft": "#ffe2d1",
  "meter": "#15140f",
  "focus": "#15140f"
};
export type Palette = { [K in keyof typeof light]: string };
export const dark: Palette = {
  "paper": "#121210",
  "surface": "#1c1c19",
  "surfaceSunken": "#262622",
  "line": "#34342f",
  "lineStrong": "#75726a",
  "ink": "#f2f0ea",
  "inkMuted": "#a9a59b",
  "action": "#d4f24a",
  "onAction": "#15140f",
  "highlight": "#d4f24a",
  "onHighlight": "#15140f",
  "highlightSoft": "#2e3312",
  "panel": "#26261f",
  "onPanel": "#f2f0ea",
  "panelMuted": "#a9a59b",
  "signal": "#ff7a45",
  "onSignal": "#15140f",
  "signalInk": "#ff8a55",
  "signalSoft": "#3a1b0d",
  "meter": "#d4f24a",
  "focus": "#d4f24a"
};
export const shadows = { light: {"shadowCard":"0 1px 2px rgba(21,20,15,0.06), 0 8px 24px rgba(21,20,15,0.06)"}, dark: {"shadowCard":"none"} } as const;
export const space = {
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32
} as const;
export const radius = {
  "sm": 6,
  "md": 14,
  "lg": 24,
  "pill": 999
} as const;
export const families = {
  "display": "Unbounded, \"Arial Black\", system-ui, sans-serif",
  "sans": "Onest, system-ui, -apple-system, \"Segoe UI\", sans-serif"
} as const;
// Имена начертаний для @expo-google-fonts.
export const fonts = {
  display: 'Unbounded_600SemiBold',
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
} as const;
export const type = {
  displayXl: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -0.9 },
  displayL: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  displayWord: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28 },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyS: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 1 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
} as const;
