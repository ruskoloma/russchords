import { KEYS, getKeyByName } from './songParser';

/**
 * Keys a beginning/intermediate guitarist can strum open-string chords in
 * without stretching for barre shapes. G and C especially are the go-to
 * "let me just play the song" keys; the rest cover popular worship keys.
 */
export const DEFAULT_EASY_KEYS = ['G', 'C', 'D', 'E', 'A'] as const;

export interface CapoHint {
	/** Fret number where the capo should be placed (0–11). */
	capoFret: number;
	/** The easy key shape the guitarist actually plays once the capo is on. */
	playAsKey: string;
}

/**
 * Given the song's displayed key, computes the smallest positive capo fret
 * that lets the guitarist play the song using one of the supplied "easy
 * keys". Returns `null` when there's no helpful capo position — e.g. the
 * song is already in an easy key, or every easy key requires a capo beyond
 * the reasonable 0–7 range.
 *
 * Semitone math uses KEYS values directly:
 *    capoFret = ((songKey.value - easyKey.value) + 12) mod 12
 *
 * Example:
 *    songKey = F, easyKey = E → capoFret = 1 (put capo on fret 1, play E shapes)
 *    songKey = F, easyKey = D → capoFret = 3 (put capo on fret 3, play D shapes)
 *    songKey = G, easyKey = G → capoFret = 0  ← treated as "already easy", returns null
 *
 * Picks the smallest non-zero fret so the guitarist stretches as little
 * as possible. Caps at fret 7 to avoid impractical positions.
 */
export function computeCapoHint(
	songKeyName: string | undefined,
	easyKeys: readonly string[] = DEFAULT_EASY_KEYS,
	maxFret: number = 7,
): CapoHint | null {
	if (!songKeyName) return null;

	const songKey = getKeyByName(songKeyName);
	if (!songKey) return null;

	// If the song itself is already in an easy key, no capo needed.
	if (easyKeys.includes(songKey.name)) return null;

	let best: CapoHint | null = null;
	for (const easyName of easyKeys) {
		const easyKey = getKeyByName(easyName);
		if (!easyKey) continue;
		const delta = ((songKey.value - easyKey.value) + 12) % 12;
		if (delta === 0 || delta > maxFret) continue;
		if (!best || delta < best.capoFret) {
			best = { capoFret: delta, playAsKey: easyKey.name };
		}
	}
	return best;
}

/**
 * List of all supported keys for the "preferred easy keys" settings UI.
 * Exported so a future settings page can render a chip-picker without
 * having to mirror the KEYS constant.
 */
export const ALL_EASY_KEY_CHOICES = KEYS.map((k) => k.name);
