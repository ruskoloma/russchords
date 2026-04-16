import type { MantineColorsTuple } from '@mantine/core';

/**
 * Brand palettes for russchords — "printed hymnal" direction.
 *
 * Away from saturated indigo + rounded corporate aesthetic. These tuples
 * lean into warm neutrals and earthy accents so the app feels more like
 * a worn paper songbook than a productivity dashboard. Still 10-stop
 * Mantine tuples (index 0 = lightest, 9 = darkest).
 *
 *  - `brand`   — muted warm ink (charcoal-with-a-hint-of-brown). Primary
 *                surfaces, focused controls, default buttons.
 *  - `accent`  — burnt terracotta for starred / pinned / active items.
 *                Reads as a warm highlight against the neutral brand.
 *  - `chord`   — subdued olive ink for chord lines above lyrics. Reads
 *                clearly on both cream and slate backgrounds without
 *                screaming "link" the way pure blue does.
 */

// Warm ink — main brand color. Nearly neutral; shade 7 is almost-black
// with a whisper of warmth so filled buttons feel tactile, not digital.
export const brandColor: MantineColorsTuple = [
	'#f5f3f0',
	'#e4e0d9',
	'#c5c0b5',
	'#a69e90',
	'#8a806f',
	'#6e6454',
	'#544b3d',
	'#3a3327',
	'#22201a',
	'#12110e',
];

// Burnt terracotta — accent for stars, pins, badges, "now playing".
// Warm, earthy, readable on cream AND on dark slate.
export const accentColor: MantineColorsTuple = [
	'#fbeee7',
	'#f4d8c9',
	'#eab79d',
	'#de9371',
	'#d37551',
	'#cc603f',
	'#c85333',
	'#a94125',
	'#8b331b',
	'#6b2712',
];

// Muted olive — chord lines inside the song viewer.
// Intentionally low-chroma so stage reading isn't visually fatiguing.
export const chordColor: MantineColorsTuple = [
	'#f2f2eb',
	'#dcdccc',
	'#bdbea0',
	'#9ba074',
	'#7e8452',
	'#6c7241',
	'#636738',
	'#52562a',
	'#454824',
	'#363919',
];
