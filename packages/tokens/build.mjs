// Собирает tokens.json (дизайн-система «Слово») в dist/tokens.ts и dist/tokens.css.
// tokens.json — единственный источник значений; dist/ не правится руками.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const t = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url), 'utf8'));
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const px = (v) => Number(String(v).replace('px', ''));

const light = {},
  dark = {};
for (const c of t.color.tokens) {
  light[camel(c.name)] = c.value.light;
  dark[camel(c.name)] = c.value.dark;
}
const shadowLight = {},
  shadowDark = {};
for (const s of t.shadow.tokens) {
  shadowLight[camel(s.name)] = s.value.light;
  shadowDark[camel(s.name)] = s.value.dark;
}
const space = Object.fromEntries(t.spacing.tokens.map((x) => [x.name.split('-')[1], px(x.value)]));
const radius = Object.fromEntries(t.radius.tokens.map((x) => [x.name.split('-')[1], px(x.value)]));

const ts = `// Сгенерировано из tokens.json. Не править вручную: npm run tokens.
export const light = ${JSON.stringify(light, null, 2)};
export type Palette = { [K in keyof typeof light]: string };
export const dark: Palette = ${JSON.stringify(dark, null, 2)};
export const shadows = { light: ${JSON.stringify(shadowLight)}, dark: ${JSON.stringify(shadowDark)} } as const;
export const space = ${JSON.stringify(space, null, 2)} as const;
export const radius = ${JSON.stringify(radius, null, 2)} as const;
export const families = ${JSON.stringify(t.type.families, null, 2)} as const;
// Имена начертаний для @expo-google-fonts.
export const fonts = {
  display: 'Unbounded_600SemiBold',
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
} as const;
export const type = {
  displayXl: { fontFamily: fonts.display, fontSize: 48, lineHeight: 52, letterSpacing: -0.9 },
  displayL: { fontFamily: fonts.display, fontSize: 36, lineHeight: 44, letterSpacing: -0.3 },
  displayWord: { fontFamily: fonts.display, fontSize: 40, lineHeight: 48 },
  titleL: { fontFamily: fonts.semibold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 32 },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 24, lineHeight: 32 },
  bodyS: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, letterSpacing: 1 },
  caption: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 20 },
  captionS: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 16 },
} as const;
`;

const vars = (obj, sh) =>
  Object.entries({ ...obj, ...sh })
    .map(([k, v]) => `  --${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${v};`)
    .join('\n');
const css = `/* Сгенерировано из tokens.json. Не править вручную: npm run tokens. */
:root, [data-theme="light"] {
${vars(light, shadowLight)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${vars(dark, shadowDark)}
  }
}
[data-theme="dark"] {
${vars(dark, shadowDark)}
}
:root {
${Object.entries(space)
  .map(([k, v]) => `  --space-${k}: ${v}px;`)
  .join('\n')}
${Object.entries(radius)
  .map(([k, v]) => `  --radius-${k}: ${v}px;`)
  .join('\n')}
${Object.entries(t.type.families)
  .map(([k, v]) => `  --font-${k}: ${v};`)
  .join('\n')}
}
`;

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/tokens.ts', import.meta.url), ts);
writeFileSync(new URL('./dist/tokens.css', import.meta.url), css);
console.log('tokens: dist/tokens.ts, dist/tokens.css');
