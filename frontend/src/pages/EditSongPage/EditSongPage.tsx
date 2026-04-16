import { useLoaderData, useNavigate } from 'react-router-dom';
import { Button, Card, Group, Stack, Text, Textarea } from '@mantine/core';
import type { SongDto } from '../../types';
import { useUpdateSong } from '../../features/song/hooks/song';
import { useSongEditor } from '../../features/song/hooks/useSongEditor';
import { SongMetaFields } from '../../features/song/components/SongMetaFields';
import { SongEditorToolbar } from '../../features/song/components/SongEditorToolbar';
import { NoWrapTextarea, BackButton } from '../../components';

/**
 * Edit song page. Thin composition over `useSongEditor`, `SongMetaFields`,
 * and `SongEditorToolbar` — all of which are shared with CreateSongPage
 * (minus the toolbar, which only exists in edit mode).
 */
export const EditSongPage = () => {
	const song = useLoaderData() as SongDto;
	const navigate = useNavigate();

	const editor = useSongEditor(song);
	const { updateSong, isUpdating } = useUpdateSong({ onSuccess: () => navigate(`/song/${song.id}`) });

	const onSave = async () => {
		await updateSong(song.id, {
			name: editor.name,
			artist: editor.artist || null,
			content: editor.content,
			rootNote: editor.rootNote || null,
			description: editor.notes.trim() || null,
		});
	};

	const onCancel = () => navigate(`/song/${song.id}`);

	return (
		<Stack gap="md">
			<Group justify="space-between" align="center">
				<Text fw={700} size="xl">
					Edit song
				</Text>
				<BackButton />
			</Group>

			<Card withBorder shadow="sm">
				<Stack gap="md">
					<SongMetaFields
						name={editor.name}
						artist={editor.artist}
						rootNote={editor.rootNote}
						onNameChange={editor.setName}
						onArtistChange={editor.setArtist}
						onRootNoteChange={editor.handleRootNoteChange}
					/>
					<SongEditorToolbar
						workKey={editor.workKey}
						onTransposeUp={editor.handleTransposeUp}
						onTransposeDown={editor.handleTransposeDown}
						onSelectKey={editor.handleSelectWorkKey}
						onContentChange={editor.setContent}
					/>
					<NoWrapTextarea
						label="Content"
						value={editor.content}
						onChange={(e) => editor.setContent(e.currentTarget.value)}
						autosize
						minRows={16}
						spellCheck={false}
					/>
					<Textarea
						label="Notes"
						description="Private notes about this song — arrangement hints, capo tips, vocal reminders."
						placeholder="Optional"
						value={editor.notes}
						onChange={(e) => editor.setNotes(e.currentTarget.value)}
						autosize
						minRows={3}
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
