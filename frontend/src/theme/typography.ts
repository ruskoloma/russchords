/**
 * Typography tokens for russchords.
 *
 * Two font families:
 *  - `Inter` for all UI surfaces (headings, body, buttons, inputs).
 *  - `JetBrains Mono` for chord + lyric lines so the chord tokens align
 *    pixel-perfect over lyric characters.
 *
 * Both are registered via `@fontsource/*` imports in main.tsx so we ship the
 * fonts ourselves (no network fetch, PWA-friendly) instead of relying on
 * Google Fonts.
 */

export const fontFamily =
	'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const fontFamilyMonospace =
	'"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const headings = {
	fontFamily,
	fontWeight: '600',
	sizes: {
		h1: { fontSize: '2rem', lineHeight: '1.25' },
		h2: { fontSize: '1.5rem', lineHeight: '1.3' },
		h3: { fontSize: '1.25rem', lineHeight: '1.35' },
		h4: { fontSize: '1.1rem', lineHeight: '1.4' },
		h5: { fontSize: '1rem', lineHeight: '1.45' },
		h6: { fontSize: '0.875rem', lineHeight: '1.5' },
	},
};
