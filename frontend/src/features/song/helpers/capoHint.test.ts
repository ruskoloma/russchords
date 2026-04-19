import { describe, expect, it } from 'vitest';
import { computeCapoHint, DEFAULT_EASY_KEYS } from './capoHint';

describe('computeCapoHint', () => {
	it('returns null for an undefined key', () => {
		expect(computeCapoHint(undefined)).toBeNull();
	});

	it('returns null when the song is already in an easy key', () => {
		for (const k of DEFAULT_EASY_KEYS) {
			expect(computeCapoHint(k)).toBeNull();
		}
	});

	it('suggests capo 1 to play F song as E shapes', () => {
		const hint = computeCapoHint('F');
		expect(hint).toEqual({ capoFret: 1, playAsKey: 'E' });
	});

	it('suggests the smallest capo fret when multiple easy keys match', () => {
		// H (value 3) — candidates:
		//   from G (11) → ((3 - 11) + 12) mod 12 = 4
		//   from A (1) → 2
		//   from E (8) → ((3 - 8) + 12) mod 12 = 7 (too big if maxFret=5)
		// Smallest is 2 → play A shapes at fret 2.
		const hint = computeCapoHint('H');
		expect(hint?.capoFret).toBe(2);
		expect(hint?.playAsKey).toBe('A');
	});

	it('returns null when every easy key is outside maxFret', () => {
		// Use a tight maxFret of 0 so nothing matches.
		expect(computeCapoHint('F', DEFAULT_EASY_KEYS, 0)).toBeNull();
	});

	it('respects a custom easy-key list', () => {
		// Song in F#, user only plays in C → capo from C (4) to F# (10) = 6.
		const hint = computeCapoHint('F#', ['C']);
		expect(hint).toEqual({ capoFret: 6, playAsKey: 'C' });
	});
});
