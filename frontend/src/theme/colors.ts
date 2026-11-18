import type { MantineColorsTuple } from '@mantine/core';

/**
 * Palette — "songbook": warm paper neutrals with a clay accent.
 * 10-stop Mantine tuples (0 = lightest, 9 = darkest).
 */

/** Clay — primary actions, active navigation, focus. */
export const brandColor: MantineColorsTuple = [
	'#fdf1ec',
	'#f8ddd2',
	'#f0b9a4',
	'#e79373',
	'#df744b',
	'#da6131',
	'#d85624',
	'#c04618',
	'#ab3d13',
	'#95320c',
];

/** Warm grays — borders, muted text, light surfaces. */
export const grayColor: MantineColorsTuple = [
	'#faf9f7',
	'#f2f0ed',
	'#e7e4df',
	'#d9d5ce',
	'#bdb7ae',
	'#9a948a',
	'#79736a',
	'#5e5850',
	'#46413b',
	'#2e2a26',
];

/** Warm charcoal — dark-mode surfaces (index 7 is the dark body). */
export const darkColor: MantineColorsTuple = [
	'#d6d2cc',
	'#b8b3ab',
	'#948e85',
	'#6f6a62',
	'#4c4842',
	'#3a3733',
	'#2d2b28',
	'#222120',
	'#1a1918',
	'#121110',
];
