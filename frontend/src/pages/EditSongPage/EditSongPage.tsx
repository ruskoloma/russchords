import { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { Button, Card, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import type { SongDto } from '../../types';
import { KEYS } from '../../helpers/songParser';
import { useUpdateSong } from '../../hooks/song';

export const EditSongPage = () => {
	const song = useLoaderData() as SongDto;
	const navigate = useNavigate();

	const [name, setName] = useState(song.name);
	const [artist, setArtist] = useState(song.artist ?? '');
	const [content, setContent] = useState(song.content);
	const [rootNote, setRootNote] = useState<string | null>(song.rootNote ?? null);

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

	return (
		<Stack gap="md">
			<Text fw={700} size="xl">
				Edit song
			</Text>

			<Card withBorder shadow="sm">
				<Stack gap="md">
					<TextInput label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} required />
					<TextInput label="Artist" value={artist} onChange={(e) => setArtist(e.currentTarget.value)} />
					<Select
						label="Root note"
						placeholder="Not set"
						data={keyOptions}
						value={rootNote}
						onChange={setRootNote}
						searchable
						clearable
						nothingFoundMessage="No keys"
						checkIconPosition="right"
					/>
					<Textarea
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
