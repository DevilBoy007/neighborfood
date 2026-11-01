import { ThemePresets, ThemePreset } from '@/constants/Colors';
import { contrastRatio } from '@/constants/contrast';

type ColorKey = keyof ThemePreset['colors'];

// [foreground, background, minimum ratio]. 4.5 = WCAG AA body text, 3 = large text/icons.
const PAIRS: [ColorKey, ColorKey, number][] = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'card', 4.5],
  ['text', 'inputBackground', 4.5],
  ['textSecondary', 'background', 4.5],
  ['textSecondary', 'surface', 4.5],
  ['textMuted', 'background', 3],
  ['textMuted', 'surface', 3],
  ['textOnPrimary', 'background', 3],
  ['navText', 'background', 3],
  ['navIcon', 'navBackground', 3],
  ['icon', 'background', 3],
  ['iconMuted', 'surface', 3],
  ['buttonText', 'buttonPrimary', 3],
  ['placeholder', 'inputBackground', 3],
  ['error', 'background', 3],
  ['error', 'surface', 3],
];

describe.each(Object.values(ThemePresets))('$displayName theme', (preset) => {
  it.each(PAIRS)('%s on %s meets %d:1', (foreground, background, minimum) => {
    const ratio = contrastRatio(preset.colors[foreground], preset.colors[background]);
    expect(ratio).toBeGreaterThanOrEqual(minimum);
  });

  it('draws titles whose fill or outline stands out from the background', () => {
    const { titleText, titleStroke, background } = preset.colors;
    expect(contrastRatio(titleText, titleStroke)).toBeGreaterThanOrEqual(3);
    expect(
      Math.max(contrastRatio(titleText, background), contrastRatio(titleStroke, background))
    ).toBeGreaterThanOrEqual(4.5);
  });
});

it('keeps white titles on light green for the default theme', () => {
  expect(ThemePresets.default.colors.titleText).toBe('#ffffff');
  expect(ThemePresets.default.colors.background).toBe('#b7ffb0');
});
