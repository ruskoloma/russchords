import type { MantineColorsTuple } from '@mantine/core';

/**
 * Brand palettes for russchords.
 *
 * Both palettes are 10-stop tuples (index 0 = lightest, index 9 = darkest)
 * conforming to Mantine's `MantineColorsTuple`. Each was hand-tuned for:
 *  - AA contrast against light and dark backgrounds at shade 6/7 (the default
 *    filled-button shade)
 *  - Good separation between neighbouring stops so hover/active states feel
 *    distinct
 *  - Non-garish saturation so chord sheets on-stage remain readable
 *
 * Use `brand` as the primary color (indigo family) and `accent` for star
 * / pinned / now-playing affordances (amber family).
 */

// Indigo-ish brand — stage-readable, professional, works on dark background.
export const brandColor: MantineColorsTuple = [
	'#eef1ff',
	'#dae0f7',
	'#b1bde9',
	'#8497db',
	'#5f77cf',
	'#4864c9',
	'#3c5ac6',
	'#2e4bae',
	'#26439d',
	'#183989',
];

// Warm amber — reserved for "starred", "pinned", "now playing", "new".
export const accentColor: MantineColorsTuple = [
	'#fff8e1',
	'#ffefcc',
	'#ffdd9c',
	'#ffca66',
	'#ffba3a',
	'#ffb01e',
	'#ffab10',
	'#e39500',
	'#ca8500',
	'#af7200',
];

// "Chord" virtual color — referenced throughout ViewerBase so chord text
// auto-adjusts for dark mode. Slightly more saturated than the brand to
// read well as highlighted text inside lyric blocks.
export const chordColor: MantineColorsTuple = [
	'#eaf2ff',
	'#d1def6',
	'#a1bbe8',
	'#6f96db',
	'#4677d0',
	'#2c64ca',
	'#1b5bc8',
	'#0e4cb2',
	'#004393',
	'#003a87',
];
