import { useCallback, useMemo, useState } from 'react';
import { usePersistentState } from '../../../lib/storage';
import {
	type ChordToken,
	type Line,
	getDelta,
	getKeyByName,
	getOriginalKey,
	normalizeKeyName,
	transposeChordToken,
} from '../helpers/songParser';
import { nextKeyDown, nextKeyUp } from '../helpers/transposeText';

/**
 * Display-time transposition of a parsed song.
 *
 * `writtenKey` is the key the text is written in (the song's root note, or
 * the first chord). The selected key is remembered for the browser session
 * under `storageKey`, so leaving a song and coming back keeps the key the
 * band agreed on.
 */
export function useTransposition(lines: Line[], writtenKey: string | null | undefined, storageKey?: string) {
	const baseKey = useMemo(
		() => normalizeKeyName(writtenKey) ?? normalizeKeyName(getOriginalKey(lines)) ?? 'C',
		[writtenKey, lines],
	);

	const [stored, setStored] = usePersistentState<string | null>(storageKey ?? 'russchords:key:unused', null, {
		kind: 'session',
		sanitize: (raw) => (typeof raw === 'string' ? normalizeKeyName(raw) : null),
	});

	// Without a storage key the choice lives in memory only.
	const [memory, setMemory] = useState<string | null>(null);
	const chosen = storageKey ? stored : memory;
	const key = chosen ?? baseKey;

	const setKey = useCallback(
		(next: string | null) => {
			const normalized = normalizeKeyName(next);
			if (!normalized) return;
			const value = normalized === baseKey ? null : normalized;
			if (storageKey) setStored(value);
			else setMemory(value);
		},
		[setStored, baseKey, storageKey],
	);

	const transpose = useMemo(() => {
		const toKey = getKeyByName(key);
		const delta = getDelta(getKeyByName(baseKey).value, toKey.value);
		return (token: ChordToken) => transposeChordToken(token, delta, toKey);
	}, [key, baseKey]);

	return {
		baseKey,
		key,
		isTransposed: key !== baseKey,
		setKey,
		up: () => setKey(nextKeyUp(key).name),
		down: () => setKey(nextKeyDown(key).name),
		reset: () => setKey(baseKey),
		transpose,
	};
}
