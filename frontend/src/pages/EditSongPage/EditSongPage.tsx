import { useEffect, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { ActionIcon, Button, Card, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import type { SongDto } from '../../types';
import {
	ALL_ACTUAL_KEYS,
	ALL_KEYS,
	KEYS,
	parseSongText,
	getOriginalKey,
	getKeyByName,
	getDelta,
	transposeChordToken,
	renderChordLine,
	fillMissingChords,
} from '../../helpers/songParser';
import { useUpdateSong } from '../../hooks/song';
import { NoWrapTextarea } from '../../components';
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';

export const EditSongPage = () => {
	const song = useLoaderData() as SongDto;
	const navigate = useNavigate();

	const [name, setName] = useState(song.name);
	const [artist, setArtist] = useState(song.artist ?? '');
	const [content, setContent] = useState(song.content);
	const [rootNote, setRootNote] = useState<string | null>(song.rootNote ?? null);

	const [workKey, setWorkKey] = useState<string>(song.rootNote ?? getOriginalKey(parseSongText(song.content)) ?? 'C');

	useEffect(() => {
		if (rootNote) {
			setWorkKey(rootNote);
		}
	}, [rootNote]);

	const transposeWholeText = (raw: string, delta: number, targetKeyName: string): string => {
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
	};

	const { updateSong, isUpdating } = useUpdateSong({ onSuccess: () => navigate(`/song/${song.id}`) });

	const keyOptions = KEYS.map((k) => ({ value: k.name, label: k.name }));

	const onSave = async () => {
		await updateSong(song.id, {
			name,
			artist: artist || null,
			content,
			rootNote: rootNote || null,
		});
	};

	const onCancel = () => {
		navigate(`/song/${song.id}`);
	};

	const handleKeySelect = (value: string | null) => {
		if (!value) return;
		const from = getKeyByName(workKey);
		const to = getKeyByName(value);
		const delta = getDelta(from.value, to.value);
		setContent((prev) => transposeWholeText(prev, delta, value));
		setWorkKey(value);
		if (rootNote !== null) {
			setRootNote(value);
		}
	};

	const handleTransposeDown = () => {
		const current = getKeyByName(workKey);
		const next =
			[...KEYS].reverse().find((k) => k.value === current.value - 1 && ALL_ACTUAL_KEYS.includes(k.name)) ||
			KEYS.at(-1)!;
		const delta = getDelta(current.value, next.value);
		setContent((prev) => transposeWholeText(prev, delta, next.name));
		setWorkKey(next.name);
		if (rootNote !== null) {
			setRootNote(next.name);
		}
	};

	const handleTransposeUp = () => {
		const current = getKeyByName(workKey);
		const next = KEYS.find((k) => k.value === current.value + 1 && ALL_ACTUAL_KEYS.includes(k.name)) || KEYS[0];
		const delta = getDelta(current.value, next.value);
		setContent((prev) => transposeWholeText(prev, delta, next.name));
		setWorkKey(next.name);
		if (rootNote !== null) {
			setRootNote(next.name);
		}
	};

	const handleRootNoteChange = (value: string | null) => {
		if (!value) {
			setRootNote(null);
			setWorkKey(getOriginalKey(parseSongText(content)) ?? 'C');
		} else {
			setRootNote(value);
			setWorkKey(value);
		}
	};

	return (
		<Stack gap="md">
			<Group justify="space-between" align="center">
				<Text fw={700} size="xl">
					Edit song
				</Text>
				<Group gap="0.5em" align="center">
					<ActionIcon onClick={handleTransposeDown} aria-label="Key down">
						<IconArrowDown />
					</ActionIcon>
					<Select
						aria-label="Editing key"
						placeholder="Select key"
						data={ALL_KEYS}
						value={workKey}
						onChange={handleKeySelect}
						w="7em"
						searchable
					/>
					<ActionIcon onClick={handleTransposeUp} aria-label="Key up">
						<IconArrowUp />
					</ActionIcon>
					<Button variant="outline" onClick={() => setContent((c) => fillMissingChords(c))}>
						Fill chords
					</Button>
				</Group>
			</Group>

			<Card withBorder shadow="sm">
				<Stack gap="md">
					<TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
					<TextInput label="Artist" value={artist} onChange={(e) => setArtist(e.currentTarget.value)} />
					<Select
						label="Root note"
						placeholder="Not set"
						data={keyOptions}
						value={rootNote}
						onChange={handleRootNoteChange}
						searchable
						clearable
						nothingFoundMessage="No keys"
						checkIconPosition="right"
					/>
					<NoWrapTextarea
						label="Content"
						value={content}
						onChange={(e) => setContent(e.currentTarget.value)}
						autosize
						minRows={16}
						spellCheck={false}
					/>
					<Group justify="flex-end">
						<Button variant="light" color="gray" onClick={onCancel}>
							Cancel
						</Button>
						<Button onClick={onSave} loading={isUpdating}>
							Save
						</Button>
					</Group>
				</Stack>
			</Card>
		</Stack>
	);
};
