/**
 * Hand-curated guitar chord-shape database for the chord-diagrams feature.
 *
 * Each entry represents a chord as a 6-string fingering: index 0 is the
 * low E string (6th), index 5 is the high e string (1st).
 *   - `frets[i]` — which fret to press on string `i`. `0` = open,
 *     `-1` = muted / don't strum.
 *   - `fingers[i]` — which finger (1–4) presses string `i`. `0` if unused.
 *   - `baseFret` — starting fret of the diagram. Defaults to 1; bump up
 *     for barre chords played higher on the neck.
 *   - `barre` — when present, the fret number of a full-bar; used to
 *     render a horizontal line across the diagram.
 *
 * The table covers the ~40 chords most common in worship music. Unknown
 * chords return `null` from `lookupChordShape` and the UI simply skips
 * them — no error, no placeholder noise.
 */

export interface ChordShape {
	frets: number[]; // 6 values, -1..n
	fingers: number[]; // 6 values, 0..4
	baseFret?: number; // usually 1
	barre?: number; // fret to bar across, if any
}

const SHAPES: Record<string, ChordShape> = {
	// --- Open major chords ---
	C: { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
	D: { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
	E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
	F: { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
	G: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4] },
	A: { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
	H: { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: 2 },
	B: { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: 2 },

	// --- Sharp / flat majors (barre shapes) ---
	'C#': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: 4 },
	Db: { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: 4 },
	'D#': { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
	Eb: { frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
	'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: 2 },
	Gb: { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: 2 },
	'G#': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: 4 },
	Ab: { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: 4 },
	'A#': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: 1 },
	Bb: { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: 1 },

	// --- Minor chords ---
	Cm: { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barre: 3 },
	Dm: { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
	Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
	Fm: { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: 1 },
	Gm: { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barre: 3 },
	Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
	Hm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: 2 },
	Bm: { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: 2 },
	'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barre: 4 },
	'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: 2 },
	'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: 4 },

	// --- 7th chords ---
	C7: { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
	D7: { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
	E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
	G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
	A7: { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
	H7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
	B7: { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },

	// --- m7 chords ---
	Am7: { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
	Dm7: { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
	Em7: { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },

	// --- Sus chords ---
	Dsus4: { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
	Asus4: { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
	Esus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
};

/**
 * Strip extensions like `maj7`, `add9`, `sus2` from a chord name so the
 * lookup falls through to the closest matching base shape. Not perfect
 * — users who play a Dsus2 will get a D diagram — but good enough for a
 * visual reference that's meant to jog muscle memory, not teach theory.
 */
function simplifyChordName(name: string): string {
	// Slash chords: drop the bass note ("G/B" → "G").
	const base = name.split('/')[0] ?? name;
	// Exact match first — covers all entries in SHAPES verbatim.
	if (SHAPES[base]) return base;
	// Strip common suffixes and try again.
	const trimmed = base.replace(/(maj|add|sus|dim|aug|\+|b5|#5|-5|b9|#9)\d*/gi, '');
	if (SHAPES[trimmed]) return trimmed;
	// Try dropping number suffixes ("Cmaj7" → "C", "A13" → "A").
	const rootOnly = trimmed.replace(/\d+$/g, '');
	if (SHAPES[rootOnly]) return rootOnly;
	return '';
}

export function lookupChordShape(name: string): ChordShape | null {
	const key = simplifyChordName(name);
	return key ? SHAPES[key] : null;
}
