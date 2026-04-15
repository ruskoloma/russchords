import { useCallback, useEffect, useState } from 'react';
import { getOriginalKey, parseSongText } from '../helpers/songParser';
import { deltaBetweenKeys, nextKeyDown, nextKeyUp, transposeWholeText } from '../helpers/transposeText';
import type { SongDto } from '../../../types';

type InitialSong = Pick<SongDto, 'name' | 'content' | 'rootNote'> & { artist?: string };

/**
 * Owns every piece of state the song editor needs:
 *  - form fields (name, artist, content, rootNote)
 *  - the "working key" separate from the saved root note, so users can
 *    transpose to try out a different key without committing a rootNote
 *    change until they explicitly pick a new root
 *  - transposition handlers (up/down/pick key) that both rewrite the
 *    content and advance the working key in lock-step
 *
 * Shared between CreateSongPage and EditSongPage so the same set of
 * controls behaves identically in both places.
 */
export function useSongEditor(initial: InitialSong) {
	const [name, setName] = useState(initial.name);
	const [artist, setArtist] = useState(initial.artist ?? '');
	const [content, setContent] = useState(initial.content);
	const [rootNote, setRootNote] = useState<string | null>(initial.rootNote ?? null);

	const [workKey, setWorkKey] = useState<string>(
		initial.rootNote ?? getOriginalKey(parseSongText(initial.content)) ?? 'C',
	);

	// If the user sets a rootNote explicitly, the working key follows suit.
	useEffect(() => {
		if (rootNote) setWorkKey(rootNote);
	}, [rootNote]);

	const transposeTo = useCallback(
		(targetKeyName: string) => {
			const delta = deltaBetweenKeys(workKey, targetKeyName);
			setContent((prev) => transposeWholeText(prev, delta, targetKeyName));
			setWorkKey(targetKeyName);
			// Only roll the saved rootNote forward if it was already explicitly set.
			if (rootNote !== null) setRootNote(targetKeyName);
		},
		[workKey, rootNote],
	);

	const handleTransposeUp = useCallback(() => {
		transposeTo(nextKeyUp(workKey).name);
	}, [workKey, transposeTo]);

	const handleTransposeDown = useCallback(() => {
		transposeTo(nextKeyDown(workKey).name);
	}, [workKey, transposeTo]);

	const handleSelectWorkKey = useCallback(
		(value: string | null) => {
			if (!value) return;
			transposeTo(value);
		},
		[transposeTo],
	);

	const handleRootNoteChange = useCallback(
		(value: string | null) => {
			if (!value) {
				setRootNote(null);
				setWorkKey(getOriginalKey(parseSongText(content)) ?? 'C');
			} else {
				setRootNote(value);
				setWorkKey(value);
			}
		},
		[content],
	);

	return {
		// form state
		name,
		setName,
		artist,
		setArtist,
		content,
		setContent,
		rootNote,
		handleRootNoteChange,
		// transposition
		workKey,
		handleTransposeUp,
		handleTransposeDown,
		handleSelectWorkKey,
	};
}
