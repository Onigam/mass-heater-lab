import { beforeAll, describe, expect, it } from 'vitest';
import { BUDGET_COLOUR, GOLD } from './model';

// The colours this lab writes into its panel, read on the kit's own card in both themes.

// the stylesheet comes from disk: the test runner empties any import of a .css. No node types in this lab: the module is named at run time.
const load = (name: string): Promise<any> => import(/* @vite-ignore */ name);
let css = '';
let simSource = '';
let stripSource = '';
beforeAll(async () => {
  const fs = await load('node:fs');
  css = String(fs.readFileSync('node_modules/@onigam/lab-kit/dist/styles.css', 'utf8'));
  simSource = String(fs.readFileSync('src/panels/sim.ts', 'utf8'));
  stripSource = String(fs.readFileSync('src/panels/strip.ts', 'utf8'));
});

/** The block of a selector in the stylesheet: its `--name: value` tokens. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe('the colours of the panel', () => {
  for (const [theme, selector] of [
    ['light', ':root'],
    ['dark', ":root[data-theme='dark']"],
  ] as const) {
    const theming = () => {
      const t = tokens(selector);
      return { t, resolve: (c: string): string => (c.startsWith('var(') ? t[c.slice(4, -1)]! : c) };
    };

    it(`hold 3:1 on the card, ${theme}: the bar of the wood, and the charts' lines`, () => {
      const { t, resolve } = theming();
      expect(t['--card']).toMatch(/^#/);
      for (const [name, c] of Object.entries(BUDGET_COLOUR))
        expect(contrast(resolve(c), t['--card']!), name).toBeGreaterThanOrEqual(3);
      // the charts: the lab's gold, and what the kit's three other series read
      for (const c of [GOLD, 'var(--copper)', 'var(--violet)', 'var(--water)'])
        expect(contrast(resolve(c), t['--card']!), c).toBeGreaterThanOrEqual(3);
    });

    it(`keep the parts of the bar apart, ${theme}`, () => {
      const { resolve } = theming();
      const parts = Object.values(BUDGET_COLOUR).map(resolve);
      expect(new Set(parts).size).toBe(parts.length);
    });

    it(`set their words at 4.5:1 on the card, ${theme}: the panel writes no colour on a text, it uses the kit's three inks`, () => {
      const { t } = theming();
      for (const ink of ['--ink', '--ink-2', '--ink-3'])
        expect(contrast(t[ink]!, t['--card']!), ink).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('are written in one place: no hard-coded colour in the panel or the strip, and not the kit’s gold', () => {
    for (const source of [simSource, stripSource]) {
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source).not.toMatch(/SERIES_COLORS\.pv/);
    }
  });
});
