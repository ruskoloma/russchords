import { useCallback, useEffect, useMemo, useState } from 'react';
import { modals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { Text } from '@mantine/core';
import type { DropResult } from '@hello-pangea/dnd';
import type { LiteSongDto, MyPlaylistDto } from '../../../types';
import {
	useAddSongToPlaylist,
	useDeletePlaylist,
	useRemoveSongFromPlaylist,
	useSavePlaylistOrder,
	useSetPlaylistPinned,
	useUpdatePlaylist,
} from './playlists';
import { useMyLightSongs } from '../../song/hooks/song';

/**
 * Owns every piece of state the playlist detail page needs to manage:
 *  - local copy of title / description / songs for in-place edit
 *  - pinned flag
 *  - drag-and-drop reorder state
 *  - the "add/remove from my songs" multi-select selection
 *  - confirmation modal flows (remove song, delete playlist)
 *
 * Returning everything as a single object keeps the page component a thin
 * composition of presentational children. Callers never destructure the full
 * shape; they usually forward sub-slices to their respective child component.
 */
export function usePlaylistEditor(initial: MyPlaylistDto, isAuthenticated: boolean, onDeleted: () => void) {
	const [title, setTitle] = useState(initial.title);
	const [description, setDescription] = useState(initial.description ?? '');
	const [editing, setEditing] = useState(false);
	const [songs, setSongs] = useState<LiteSongDto[]>(initial.songs ?? []);
	const [pinned, setPinned] = useState<boolean>(initial.isPinned);

	// Keep the local song list in sync when the loader reruns (e.g. after
	// navigating back and the SWR cache returns fresh data).
	useEffect(() => setSongs(initial.songs ?? []), [initial.songs]);

	const { updatePlaylist, isUpdating } = useUpdatePlaylist();
	const { removeSongFromPlaylist, isRemoving } = useRemoveSongFromPlaylist();
	const { saveOrder } = useSavePlaylistOrder();
	const { setPinned: setPinnedReq, isSetting } = useSetPlaylistPinned();
	const { deletePlaylist, isDeleting: isDeletingPlaylist } = useDeletePlaylist();
	const { addSongToPlaylist, isAdding: isAddingSong } = useAddSongToPlaylist();

	// Authenticated users' full song library for the "add more" MultiSelect.
	const { songs: mySongs, isLoading: isLoadingMySongs } = useMyLightSongs(isAuthenticated);

	const mySongOptions = useMemo(
		() =>
			mySongs.map((s) => ({
				value: String(s.id),
				label: s.artist ? `${s.name} — ${s.artist}` : s.name,
			})),
		[mySongs],
	);

	const selectedIdsFromPlaylist = useMemo(
		() => songs.filter((s) => mySongs.some((ms) => ms.id === s.id)).map((s) => String(s.id)),
		[songs, mySongs],
	);

	const [selectedIds, setSelectedIds] = useState<string[]>(selectedIdsFromPlaylist);
	useEffect(() => {
		if (!isAuthenticated) return;
		setSelectedIds(selectedIdsFromPlaylist);
	}, [selectedIdsFromPlaylist, isAuthenticated]);

	const onChangeSelected = useCallback(
		async (values: string[]) => {
			const prev = new Set(selectedIds);
			const next = new Set(values);

			const toAdd = [...next].filter((id) => !prev.has(id));
			const toRemove = [...prev].filter((id) => !next.has(id));

			for (const idStr of toAdd) {
				const id = parseInt(idStr, 10);
				await addSongToPlaylist(initial.playlistId, id);
				const added = mySongs.find((s) => s.id === id);
				if (added) setSongs((prevSongs) => [...prevSongs, added]);
			}

			for (const idStr of toRemove) {
				const id = parseInt(idStr, 10);
				await removeSongFromPlaylist(initial.playlistId, id);
				setSongs((prevSongs) => prevSongs.filter((s) => s.id !== id));
			}

			setSelectedIds(values);
		},
		[selectedIds, addSongToPlaylist, removeSongFromPlaylist, initial.playlistId, mySongs],
	);

	const onDragEnd = useCallback((result: DropResult) => {
		const { source, destination } = result;
		if (!destination) return;
		if (source.index === destination.index) return;
		setSongs((prev) => {
			const next = prev.slice();
			const [moved] = next.splice(source.index, 1);
			next.splice(destination.index, 0, moved);
			return next;
		});
	}, []);

	const onEnterEdit = useCallback(() => setEditing(true), []);

	const onSaveMeta = useCallback(async () => {
		const orderedIds = songs.map((s) => s.id);
		await Promise.all([
			updatePlaylist(initial.playlistId, { title, description }),
			saveOrder(initial.playlistId, orderedIds),
		]);
		setEditing(false);
	}, [songs, updatePlaylist, initial.playlistId, title, description, saveOrder]);

	const onCancelMeta = useCallback(() => {
		setTitle(initial.title);
		setDescription(initial.description ?? '');
		setEditing(false);
	}, [initial.title, initial.description]);

	const togglePin = useCallback(async () => {
		const next = !pinned;
		setPinned(next);
		try {
			await setPinnedReq(initial.playlistId, next);
		} catch {
			setPinned(!next);
		}
	}, [pinned, setPinnedReq, initial.playlistId]);

	const removeSongByButton = useCallback(
		(songId: number) => {
			modals.openConfirmModal({
				title: 'Remove song',
				children: <Text size="sm">Are you sure you want to remove this song from the playlist?</Text>,
				labels: { confirm: 'Remove', cancel: 'Cancel' },
				confirmProps: { color: 'red' },
				onConfirm: async () => {
					setSongs((prev) => prev.filter((s) => s.id !== songId));
					await removeSongFromPlaylist(initial.playlistId, songId);
				},
			});
		},
		[removeSongFromPlaylist, initial.playlistId],
	);

	const onDeletePlaylist = useCallback(() => {
		modals.openConfirmModal({
			title: 'Delete playlist',
			children: <Text size="sm">Are you sure you want to delete this playlist? This action cannot be undone.</Text>,
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: async () => {
				await deletePlaylist(initial.playlistId);
				onDeleted();
			},
		});
	}, [deletePlaylist, initial.playlistId, onDeleted]);

	const copySongList = useCallback(() => {
		const text = songs.map((s) => s.name).join('\n');
		void navigator.clipboard.writeText(text);
		showNotification({
			title: 'Copied',
			message: 'Song list copied to clipboard',
			color: 'green',
			autoClose: 500,
		});
	}, [songs]);

	return {
		// meta state
		title,
		description,
		editing,
		setTitle,
		setDescription,
		onEnterEdit,
		onSaveMeta,
		onCancelMeta,
		isUpdating,
		// songs state
		songs,
		onDragEnd,
		removeSongByButton,
		isRemoving,
		// pin state
		pinned,
		togglePin,
		isSetting,
		// delete
		onDeletePlaylist,
		isDeletingPlaylist,
		// add/remove my songs (owner edit mode)
		selectedIds,
		onChangeSelected,
		mySongOptions,
		isLoadingMySongs,
		isAddingSong,
		// utilities
		copySongList,
	};
}
