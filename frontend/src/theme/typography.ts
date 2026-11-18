/**
 * Inter for the UI, JetBrains Mono for chord sheets (monospace keeps chords
 * aligned above the lyrics). Both are bundled via @fontsource so the app
 * works offline.
 */

export const fontFamily =
	'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const fontFamilyMonospace =
	'"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const headings = {
	fontFamily,
	fontWeight: '700',
	sizes: {
		h1: { fontSize: '1.75rem', lineHeight: '1.2' },
		h2: { fontSize: '1.375rem', lineHeight: '1.25' },
		h3: { fontSize: '1.125rem', lineHeight: '1.3' },
		h4: { fontSize: '1rem', lineHeight: '1.4' },
		h5: { fontSize: '0.9375rem', lineHeight: '1.45' },
		h6: { fontSize: '0.875rem', lineHeight: '1.5' },
	},
};
