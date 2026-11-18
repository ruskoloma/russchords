import { useState } from 'react';
import { Button, Group, Modal, Stack, TextInput, Textarea } from '@mantine/core';
import { useCreatePlaylist } from '../../../api/playlists';
import type { PlaylistDto } from '../../../types';

interface CreatePlaylistModalProps {
	opened: boolean;
	onClose: () => void;
	onCreated: (playlist: PlaylistDto) => void;
}

export function CreatePlaylistModal({ opened, onClose, onCreated }: CreatePlaylistModalProps) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const create = useCreatePlaylist();

	const close = () => {
		setTitle('');
		setDescription('');
		onClose();
	};

	const submit = async () => {
		if (!title.trim()) return;
		const created = await create.mutateAsync({ title: title.trim(), description: description.trim() || null });
		close();
		onCreated(created);
	};

	return (
		<Modal opened={opened} onClose={close} title="New playlist">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void submit();
				}}
			>
				<Stack gap="sm">
					<TextInput
						label="Title"
						placeholder="Sunday service, 12 May"
						value={title}
						onChange={(e) => setTitle(e.currentTarget.value)}
						required
						data-autofocus
					/>
					<Textarea
						label="Description"
						placeholder="Optional"
						value={description}
						onChange={(e) => setDescription(e.currentTarget.value)}
						autosize
						minRows={2}
					/>
					<Group justify="flex-end" mt="xs">
						<Button variant="default" onClick={close}>
							Cancel
						</Button>
						<Button type="submit" loading={create.isPending} disabled={!title.trim()}>
							Create
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
