import {
	ALL_ACTUAL_KEYS,
	KEYS,
	getDelta,
	getKeyByName,
	parseSongText,
	renderChordLine,
	transposeChordToken,
} from './songParser';

/**
 * Pure helper that walks an entire song text and transposes every chord
 * line by `delta` semitones toward `targetKeyName`, preserving leading
 * whitespace so chords stay aligned over lyrics.
 *
 * Non-chord lines (headers, text, empty) pass through unchanged.
 */
export function transposeWholeText(raw: string, delta: number, targetKeyName: string): string {
	const targetKey = getKeyByName(targetKeyName);
	const parsed = parseSongText(raw);
	const out: string[] = [];

	for (const line of parsed) {
		if (line.type === 'chords') {
			const newTokens = line.tokens.map((t) => transposeChordToken(t, delta, targetKey));
			out.push(renderChordLine(newTokens));
		} else if (line.type === 'header') {
			out.push(line.content);
		} else if (line.type === 'text') {
			out.push(line.content);
		} else {
			out.push('');
		}
	}

	return out.join('\n');
}

/**
 * Given the current working key, returns the next key one semitone higher
 * from the `ALL_ACTUAL_KEYS` whitelist. Wraps to the first entry if the
 * current key is at the top of the scale.
 */
export function nextKeyUp(currentKeyName: string) {
	const current = getKeyByName(currentKeyName);
	return KEYS.find((k) => k.value === current.value + 1 && ALL_ACTUAL_KEYS.includes(k.name)) ?? KEYS[1];
}

/**
 * Given the current working key, returns the next key one semitone lower
 * from the `ALL_ACTUAL_KEYS` whitelist. Wraps to the last entry if the
 * current key is at the bottom of the scale.
 */
export function nextKeyDown(currentKeyName: string) {
	const current = getKeyByName(currentKeyName);
	return (
		[...KEYS].reverse().find((k) => k.value === current.value - 1 && ALL_ACTUAL_KEYS.includes(k.name)) ?? KEYS.at(-1)!
	);
}

/**
 * Utility: compute the signed semitone delta between two key names.
 * Thin wrapper around `getDelta(fromKey.value, toKey.value)` so callers
 * don't have to look up key metadata themselves.
 */
export function deltaBetweenKeys(fromName: string, toName: string) {
	return getDelta(getKeyByName(fromName).value, getKeyByName(toName).value);
}
