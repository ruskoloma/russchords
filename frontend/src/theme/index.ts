import { createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { accentColor, brandColor, chordColor } from './colors';
import { components } from './components';
import { fontFamily, fontFamilyMonospace, headings } from './typography';

/**
 * The russchords Mantine theme.
 *
 * This file is the single source of truth for brand colors, typography,
 * spacing scale, breakpoints, and component defaults. Adding a new design
 * token? Edit this file (or one of its siblings in `src/theme/`) — never
 * hardcode a color in a component again.
 */
export const theme = createTheme({
	primaryColor: 'brand',
	primaryShade: { light: 6, dark: 5 },
	autoContrast: true,
	defaultRadius: 'md',
	cursorType: 'pointer',

	fontFamily,
	fontFamilyMonospace,
	headings,

	colors: {
		brand: brandColor,
		accent: accentColor,
		chord: chordColor,
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
 *
 * The `key` is namespaced so a single browser profile using multiple Mantine
 * apps doesn't collide.
 */
export const colorSchemeManager = localStorageColorSchemeManager({
	key: 'russchords-color-scheme',
});
