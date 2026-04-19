import { createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { accentColor, brandColor, chordColor } from './colors';
import { components } from './components';
import { fontFamily, fontFamilyMonospace, headings } from './typography';

/**
 * The russchords Mantine theme.
 *
 * Design direction: "printed hymnal" — warm neutrals, sharp corners,
 * minimal shadows. Intentionally moves away from the saturated indigo +
 * rounded-everything aesthetic; closer to a worn paper songbook than a
 * productivity dashboard.
 */
export const theme = createTheme({
	primaryColor: 'brand',
	primaryShade: { light: 7, dark: 4 },
	autoContrast: true,
	// Sharper corners everywhere. `sm` is the new default (4px) with a
	// tighter overall scale — see `radius` below.
	defaultRadius: 'sm',
	cursorType: 'pointer',

	fontFamily,
	fontFamilyMonospace,
	headings,

	colors: {
		brand: brandColor,
		accent: accentColor,
		chord: chordColor,
	},

	radius: {
		xs: '2px',
		sm: '4px',
		md: '6px',
		lg: '8px',
		xl: '12px',
	},

	// Very restrained shadow scale — the hymnal direction avoids the
	// "floating card" look. `sm` is a 1px hairline; `xs` is almost nothing.
	shadows: {
		xs: '0 0 0 1px rgba(0, 0, 0, 0.04)',
		sm: '0 1px 0 rgba(0, 0, 0, 0.06)',
		md: '0 1px 2px rgba(0, 0, 0, 0.08)',
		lg: '0 2px 4px rgba(0, 0, 0, 0.08)',
		xl: '0 4px 8px rgba(0, 0, 0, 0.08)',
	},

	breakpoints: {
		xs: '36em', // 576px  — small phones
		sm: '48em', // 768px  — tablets
		md: '62em', // 992px  — small laptops
		lg: '75em', // 1200px — desktops
		xl: '88em', // 1408px — large desktops
	},

	components,
});

/**
 * Color-scheme manager persists the user's light/dark/auto choice in
 * localStorage. Consumed by <MantineProvider /> in main.tsx.
 */
export const colorSchemeManager = localStorageColorSchemeManager({
	key: 'russchords-color-scheme',
});
