import { createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { brandColor, darkColor, grayColor } from './colors';
import { components } from './components';
import { fontFamily, fontFamilyMonospace, headings } from './typography';

export const theme = createTheme({
	primaryColor: 'brand',
	primaryShade: { light: 7, dark: 6 },
	autoContrast: true,
	defaultRadius: 'md',
	cursorType: 'pointer',
	focusRing: 'auto',

	fontFamily,
	fontFamilyMonospace,
	headings,

	colors: {
		brand: brandColor,
		gray: grayColor,
		dark: darkColor,
	},

	radius: {
		xs: '4px',
		sm: '6px',
		md: '8px',
		lg: '12px',
		xl: '16px',
	},

	shadows: {
		xs: '0 1px 2px rgba(30, 24, 18, 0.06)',
		sm: '0 1px 3px rgba(30, 24, 18, 0.08), 0 1px 2px rgba(30, 24, 18, 0.04)',
		md: '0 4px 12px rgba(30, 24, 18, 0.10), 0 1px 3px rgba(30, 24, 18, 0.06)',
		lg: '0 10px 24px rgba(30, 24, 18, 0.12), 0 2px 6px rgba(30, 24, 18, 0.06)',
		xl: '0 18px 40px rgba(30, 24, 18, 0.16)',
	},

	breakpoints: {
		xs: '36em',
		sm: '48em',
		md: '62em',
		lg: '75em',
		xl: '88em',
	},

	components,
});

/** Persists the light/dark/auto choice. Key must match the script in index.html. */
export const colorSchemeManager = localStorageColorSchemeManager({
	key: 'russchords-color-scheme',
});
