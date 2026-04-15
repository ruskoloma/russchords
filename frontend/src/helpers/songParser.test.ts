import { describe, expect, it } from 'vitest';
import {
	ALL_ACTUAL_KEYS,
	ALL_KEYS,
	fillMissingChords,
	getChordRoot,
	getDelta,
	getHeaderType,
	getKeyByName,
	getNewKey,
	getOriginalKey,
	isChordLine,
	isHeaderLine,
	KEYS,
	parseChordLineWithSpaces,
	parseSongText,
	renderChordLine,
	transposeChord,
	transposeChordToken,
} from './songParser';

// ---------------------------------------------------------------------------
// getChordRoot
// ---------------------------------------------------------------------------
describe('getChordRoot', () => {
	it.each([
		['C', 'C'],
		['G', 'G'],
		['Cm', 'C'],
		['C#', 'C#'],
		['C#m', 'C#'],
		['Bb', 'Bb'],
		['Bb7', 'Bb'],
		['F#maj7', 'F#'],
		['D#m7b5', 'D#'],
	])('extracts root from "%s" → "%s"', (input, expected) => {
		expect(getChordRoot(input)).toBe(expected);
	});
});

// ---------------------------------------------------------------------------
// getKeyByName
// ---------------------------------------------------------------------------
describe('getKeyByName', () => {
	it('resolves natural names', () => {
		expect(getKeyByName('C').value).toBe(4);
		expect(getKeyByName('D').value).toBe(6);
		expect(getKeyByName('G').value).toBe(11);
	});

	it('resolves sharps and flats distinctly', () => {
		expect(getKeyByName('C#').type).toBe('S');
		expect(getKeyByName('Db').type).toBe('F');
		expect(getKeyByName('C#').value).toBe(getKeyByName('Db').value);
	});

	it('normalizes plain "B" to "H" (European notation)', () => {
		expect(getKeyByName('B').name).toBe('H');
		expect(getKeyByName('B').value).toBe(3);
	});

	it('does NOT normalize "Bb" to "H"', () => {
		// "Bb" is a two-char root and should map to flat variant at value 2
		expect(getKeyByName('Bb').name).toBe('Bb');
		expect(getKeyByName('Bb').type).toBe('F');
	});

	it('resolves robustly when given a chord with modifiers', () => {
		expect(getKeyByName('Cm7').name).toBe('C');
		expect(getKeyByName('F#maj7').name).toBe('F#');
	});
});

// ---------------------------------------------------------------------------
// getDelta
// ---------------------------------------------------------------------------
describe('getDelta', () => {
	it('computes the arithmetic difference between two indices', () => {
		expect(getDelta(0, 1)).toBe(1);
		expect(getDelta(4, 6)).toBe(2);
		expect(getDelta(4, 4)).toBe(0);
		expect(getDelta(11, 1)).toBe(-10);
	});
});

// ---------------------------------------------------------------------------
// getNewKey — enharmonic preferences
// ---------------------------------------------------------------------------
describe('getNewKey', () => {
	it('returns a natural key when one exists at the destination', () => {
		// C (4) + 2 = 6 → D (unique natural)
		const result = getNewKey('C', 2, getKeyByName('D'));
		expect(result.name).toBe('D');
	});

	it('prefers the caller-supplied accidental hint when destination is enharmonic', () => {
		// C (4) + 1 = 5 → C#/Db (both valid)
		const sharp = getNewKey('C', 1, getKeyByName('C#'), 'S');
		const flat = getNewKey('C', 1, getKeyByName('Db'), 'F');
		expect(sharp.name).toBe('C#');
		expect(flat.name).toBe('Db');
	});

	it('wraps around negative deltas', () => {
		// C (4) + -4 = 0 → G#/Ab. Default (no preference) → falls through N→S→F
		const result = getNewKey('C', -4, getKeyByName('Ab'));
		// value 0 has no natural, so expect sharp or flat
		expect(result.value).toBe(0);
		expect(['G#', 'Ab']).toContain(result.name);
	});

	it('falls through N → S → F when no hint and no target-type match', () => {
		// Target natural at enharmonic value: target's "type" is still N, no natural exists
		// C (4) + 1 = 5, target type N → tryPick N misses, falls to S → C#
		const result = getNewKey('C', 1, getKeyByName('D')); // D is natural
		expect(result.value).toBe(5);
		expect(['C#', 'Db']).toContain(result.name);
	});

	it('throws on unknown old key', () => {
		expect(() => getNewKey('XYZ', 1, getKeyByName('C'))).toThrow();
	});
});

// ---------------------------------------------------------------------------
// transposeChord
// ---------------------------------------------------------------------------
describe('transposeChord', () => {
	it('returns the original spelling when delta is 0', () => {
		// Delta 0 is an explicit short-circuit that preserves exact input
		expect(transposeChord('C', 0, getKeyByName('C'))).toBe('C');
		expect(transposeChord('Bb', 0, getKeyByName('Bb'))).toBe('Bb');
		expect(transposeChord('F#m7', 0, getKeyByName('F#'))).toBe('F#m7');
	});

	it('transposes C → D by +2', () => {
		expect(transposeChord('C', 2, getKeyByName('D'))).toBe('D');
	});

	it('transposes Am → Hm by +2 (European B)', () => {
		// A (1) + 2 = 3 = H. Suffix "m" preserved.
		const delta = getDelta(getKeyByName('A').value, getKeyByName('H').value);
		expect(transposeChord('Am', delta, getKeyByName('H'))).toBe('Hm');
	});

	it('preserves chord suffix through transposition', () => {
		expect(transposeChord('Cmaj7', 2, getKeyByName('D'))).toBe('Dmaj7');
		expect(transposeChord('Am7', 2, getKeyByName('H'))).toBe('Hm7');
	});

	it('transposes sharp chords, respecting the token accidental hint', () => {
		// F# (10) + 1 = 11 → G (natural, unique). Suffix preserved.
		expect(transposeChord('F#m', 1, getKeyByName('G'))).toBe('Gm');
	});

	it('transposes flat chords, respecting the token accidental hint', () => {
		// Bb (2) + 2 = 4 → C (natural, unique)
		expect(transposeChord('Bb', 2, getKeyByName('C'))).toBe('C');
	});

	it('transposes slash chords, preserving the slash structure', () => {
		// C/E + 2 semitones, target D → D/F#
		// C (4) + 2 = 6 → D. E (8) + 2 = 10 → F# (sharp due to target's neighborhood)
		const result = transposeChord('C/E', 2, getKeyByName('D'));
		expect(result).toMatch(/^D\//);
		expect(result.split('/').length).toBe(2);
	});

	it('returns input unchanged for non-chord strings', () => {
		// Regex rejects garbage; function must not throw and must return input as-is
		expect(transposeChord('hello', 2, getKeyByName('D'))).toBe('hello');
		expect(transposeChord('', 2, getKeyByName('D'))).toBe('');
	});
});

// ---------------------------------------------------------------------------
// transposeChordToken — space preservation
// ---------------------------------------------------------------------------
describe('transposeChordToken', () => {
	it('preserves leading spaces verbatim', () => {
		const token = { chord: 'C', spaces: 3, leading: 4 };
		const result = transposeChordToken(token, 2, getKeyByName('D'));
		expect(result.chord).toBe('D');
		expect(result.leading).toBe(4); // leading never adjusted
	});

	it('widens trailing spaces when the new chord is shorter', () => {
		// F# → G: length shrinks by 1 → trailing spaces grow by 1 to maintain alignment
		const token = { chord: 'F#', spaces: 2, leading: 0 };
		const result = transposeChordToken(token, 1, getKeyByName('G'));
		expect(result.chord).toBe('G');
		expect(result.spaces).toBe(3);
	});

	it('narrows trailing spaces when the new chord is longer', () => {
		// G → G# (hypothetical length grow by 1) → spaces shrink by 1
		const token = { chord: 'G', spaces: 4, leading: 0 };
		const result = transposeChordToken(token, 1, getKeyByName('G#'));
		// G (11) + 1 = 0 → G# or Ab. Expect 2-char name. Spaces: 4 + (1 - 2) = 3
		expect(result.chord.length).toBe(2);
		expect(result.spaces).toBe(3);
	});

	it('never produces fewer than 1 trailing space (alignment floor)', () => {
		// Force a scenario where naive math would return 0 or negative
		const token = { chord: 'C', spaces: 0, leading: 0 };
		const result = transposeChordToken(token, 1, getKeyByName('C#')); // C→C# grows by 1
		expect(result.spaces).toBeGreaterThanOrEqual(1);
	});
});

// ---------------------------------------------------------------------------
// parseSongText — structural classification
// ---------------------------------------------------------------------------
describe('parseSongText', () => {
	it('classifies an empty line as type "empty"', () => {
		const result = parseSongText('\n\n');
		expect(result[0].type).toBe('empty');
		expect(result[1].type).toBe('empty');
	});

	it('classifies a header line and preserves its content', () => {
		const [line] = parseSongText('Verse:');
		expect(line.type).toBe('header');
		if (line.type === 'header') {
			expect(line.content).toBe('Verse:');
		}
	});

	it('classifies Slavic headers (Ukrainian, Russian) as headers', () => {
		const [ua] = parseSongText('Приспів:');
		const [ru] = parseSongText('Припев:');
		expect(ua.type).toBe('header');
		expect(ru.type).toBe('header');
	});

	it('classifies a chord line and extracts tokens', () => {
		const [line] = parseSongText('C  Am  F  G');
		expect(line.type).toBe('chords');
		if (line.type === 'chords') {
			expect(line.tokens.map((t) => t.chord)).toEqual(['C', 'Am', 'F', 'G']);
		}
	});

	it('classifies plain lyric text as type "text"', () => {
		const [line] = parseSongText('Amazing grace, how sweet the sound');
		expect(line.type).toBe('text');
		if (line.type === 'text') {
			expect(line.content).toContain('Amazing grace');
		}
	});

	it('parses a mixed multi-line song correctly', () => {
		const song = ['Verse:', 'C   G   Am  F', 'Amazing grace, how sweet the sound', '', 'Chorus:', 'F   C', 'Praise'].join(
			'\n',
		);
		const result = parseSongText(song);
		expect(result[0].type).toBe('header');
		expect(result[1].type).toBe('chords');
		expect(result[2].type).toBe('text');
		expect(result[3].type).toBe('empty');
		expect(result[4].type).toBe('header');
		expect(result[5].type).toBe('chords');
		expect(result[6].type).toBe('text');
	});

	it('normalizes unicode whitespace to regular spaces', () => {
		// Song content sometimes contains non-breaking space (U+00A0) from copy-paste
		const song = 'C\u00A0\u00A0G';
		const [line] = parseSongText(song);
		expect(line.type).toBe('chords');
	});
});

// ---------------------------------------------------------------------------
// isChordLine
// ---------------------------------------------------------------------------
describe('isChordLine', () => {
	it.each([
		['C Am F G', true],
		['C#m7 F#sus4 Bb G', true],
		['| C | Am | F | G |', true],
		['C (2x)', true],
		['NC', true],
		['Amazing grace how sweet', false],
		['Verse:', false],
	])('isChordLine("%s") → %s', (input, expected) => {
		expect(isChordLine(input)).toBe(expected);
	});
});

// ---------------------------------------------------------------------------
// isHeaderLine + getHeaderType
// ---------------------------------------------------------------------------
describe('isHeaderLine', () => {
	it.each([['Verse:'], ['Chorus:'], ['Bridge:'], ['Intro:'], ['Outro:'], ['1:'], ['2:'], ['Припев:'], ['Приспів:']])(
		'accepts "%s" as a header',
		(input) => {
			expect(isHeaderLine(input)).toBe(true);
		},
	);

	it('rejects long lines even if they contain a header token', () => {
		const long = 'This is a very long line that happens to contain verse: inside it somewhere';
		expect(isHeaderLine(long)).toBe(false);
	});

	it('rejects plain text without a recognized anchor', () => {
		expect(isHeaderLine('just some lyrics here')).toBe(false);
	});
});

describe('getHeaderType', () => {
	it('classifies English verse headers', () => {
		expect(getHeaderType('Verse:')).toBe('verse');
	});

	it('classifies numbered-anchor headers like "1:" as "other" (current behavior)', () => {
		// '1:' alone is caught by HEADER_ANCHORS but does not match 'verse:' substring.
		// Pinning current behavior so the upcoming refactor doesn't accidentally change it.
		expect(getHeaderType('1:')).toBe('other');
	});

	it('classifies English chorus headers', () => {
		expect(getHeaderType('Chorus:')).toBe('chorus');
		expect(getHeaderType('Hook:')).toBe('chorus');
	});

	it('classifies other known sections as "other"', () => {
		expect(getHeaderType('Bridge:')).toBe('other');
		expect(getHeaderType('Intro:')).toBe('other');
	});

	it('classifies Ukrainian "Приспів:" as chorus', () => {
		expect(getHeaderType('Приспів:')).toBe('chorus');
	});

	it('returns null for non-header lines', () => {
		expect(getHeaderType('just lyrics')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// parseChordLineWithSpaces + renderChordLine (round-trip)
// ---------------------------------------------------------------------------
describe('parseChordLineWithSpaces / renderChordLine', () => {
	it('preserves leading whitespace so chords align over lyrics', () => {
		const tokens = parseChordLineWithSpaces('  C       Am');
		expect(tokens[0]).toMatchObject({ chord: 'C', leading: 2 });
		expect(tokens[1]).toMatchObject({ chord: 'Am' });
	});

	it('round-trips through renderChordLine', () => {
		const input = '  C       Am      F       G';
		const tokens = parseChordLineWithSpaces(input);
		// Rendered line length should match the input (parenthetical stripping aside)
		expect(renderChordLine(tokens).length).toBe(input.length);
	});
});

// ---------------------------------------------------------------------------
// getOriginalKey
// ---------------------------------------------------------------------------
describe('getOriginalKey', () => {
	it('returns the root of the first chord in the song', () => {
		const parsed = parseSongText(['Verse:', 'C  G  Am  F', 'Amazing grace'].join('\n'));
		expect(getOriginalKey(parsed)).toBe('C');
	});

	it('handles a song that starts with a minor chord', () => {
		const parsed = parseSongText(['Verse:', 'Am  G  F', 'Lyrics line'].join('\n'));
		expect(getOriginalKey(parsed)).toBe('A');
	});

	it('skips non-chord lines when looking for the first chord', () => {
		const parsed = parseSongText(['Intro:', 'Some text first', 'C  G  Am', 'Chords happen'].join('\n'));
		expect(getOriginalKey(parsed)).toBe('C');
	});

	it('returns undefined when the song has no chord lines', () => {
		const parsed = parseSongText(['Verse:', 'Text only song', 'No chords here'].join('\n'));
		expect(getOriginalKey(parsed)).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// fillMissingChords — template propagation
// ---------------------------------------------------------------------------
describe('fillMissingChords', () => {
	it('copies chords from the first verse into a subsequent verse that has none', () => {
		const input = [
			'Verse:',
			'C   G   Am  F',
			'Amazing grace how sweet the sound',
			'',
			'Verse:',
			'That saved a wretch like me',
		].join('\n');
		const output = fillMissingChords(input);
		const lines = output.split('\n');
		// The second verse should now contain a chord line above its lyric
		const secondVerseIdx = lines.lastIndexOf('Verse:');
		const secondVerseBody = lines.slice(secondVerseIdx + 1);
		expect(secondVerseBody.some((l) => isChordLine(l))).toBe(true);
	});

	it('leaves sections alone when they already have chords', () => {
		const input = [
			'Verse:',
			'C   G   Am  F',
			'Amazing grace',
			'',
			'Verse:',
			'Dm  G   C',
			'That saved a wretch',
		].join('\n');
		const output = fillMissingChords(input);
		// The chorus's original chords should survive
		expect(output).toContain('Dm  G   C');
	});

	it('propagates chorus templates separately from verse templates', () => {
		const input = [
			'Verse:',
			'C   G',
			'Verse line',
			'',
			'Chorus:',
			'F   C',
			'Chorus line',
			'',
			'Verse:',
			'Second verse line',
			'',
			'Chorus:',
			'Second chorus line',
		].join('\n');
		const output = fillMissingChords(input);
		// Second verse should get 'C   G' applied; second chorus should get 'F   C'
		const lines = output.split('\n');
		const verseHeaderIndices = lines
			.map((l, i) => (l === 'Verse:' ? i : -1))
			.filter((i) => i >= 0);
		expect(verseHeaderIndices.length).toBe(2);
		// After the second verse header, a chord line should exist before the lyric
		const afterSecondVerse = lines.slice(verseHeaderIndices[1] + 1);
		expect(afterSecondVerse.some((l) => isChordLine(l))).toBe(true);
	});

	it('is a no-op when the song contains no templates to copy', () => {
		const input = ['Verse:', 'No chords anywhere', '', 'Verse:', 'Still no chords'].join('\n');
		expect(fillMissingChords(input)).toBe(input);
	});
});

// ---------------------------------------------------------------------------
// Sanity checks on exported constants
// ---------------------------------------------------------------------------
describe('exported constants', () => {
	it('ALL_KEYS is a superset of ALL_ACTUAL_KEYS', () => {
		for (const key of ALL_ACTUAL_KEYS) {
			expect(ALL_KEYS).toContain(key);
		}
	});

	it('every key in ALL_ACTUAL_KEYS resolves via getKeyByName', () => {
		for (const name of ALL_ACTUAL_KEYS) {
			expect(getKeyByName(name)).toBeDefined();
		}
	});

	it('KEYS has exactly 12 distinct semitone values spread across 0–11', () => {
		const values = new Set(KEYS.map((k) => k.value));
		expect(values.size).toBe(12);
		for (let v = 0; v <= 11; v++) {
			expect(values.has(v)).toBe(true);
		}
	});
});
