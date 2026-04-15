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
 * Owns every piece of state the playlist detail page needs to manage.
 *
 * Edit semantics: all song add/remove/reorder actions are staged locally.
 * Nothing hits the backend until the user clicks Save. Cancel restores the
 * original loaded state. This matches the "edit until you save" mental
 * model users expect — and removes the need for a confirmation popup on
 * every individual song removal.
 */
export function usePlaylistEditor(initial: MyPlaylistDto, isAuthenticated: boolean, onDeleted: () => void) {
	const [title, setTitle] = useState(initial.title);
	const [description, setDescription] = useState(initial.description ?? '');
	const [editing, setEditing] = useState(false);
	const [songs, setSongs] = useState<LiteSongDto[]>(initial.songs ?? []);
	const [pinned, setPinned] = useState<boolean>(initial.isPinned);

	// Keep the local song list in sync when the loader reruns (e.g. after
	// navigating back and the SWR cache returns fresh data) BUT only when
	// we're not in the middle of editing — otherwise mutations from other
	// tabs would clobber the user's in-progress changes.
	useEffect(() => {
		if (editing) return;
		setSongs(initial.songs ?? []);
	}, [initial.songs, editing]);

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

	// `selectedIds` mirrors the staged `songs` list, filtered to entries that
	// also exist in the user's personal song library (so the MultiSelect can
	// display them as selected pills). When `songs` changes via drag, trash,
	// or multi-select, selectedIds stays in sync.
	const selectedIds = useMemo(() => {
		const mySongIds = new Set(mySongs.map((s) => s.id));
		return songs.filter((s) => mySongIds.has(s.id)).map((s) => String(s.id));
	}, [songs, mySongs]);

	const onChangeSelected = useCallback(
		(values: string[]) => {
			// Purely local — no API calls. Compute diff vs. currently staged
			// songs and update the local list, which triggers selectedIds via
			// the useMemo above.
			const nextSet = new Set(values);
			const currentSet = new Set(songs.map((s) => String(s.id)));

			setSongs((prev) => {
				let next = prev;
				// Add newly selected songs (push to end of list).
				for (const idStr of values) {
					if (!currentSet.has(idStr)) {
						const added = mySongs.find((s) => s.id === parseInt(idStr, 10));
						if (added && !next.some((s) => s.id === added.id)) {
							next = [...next, added];
						}
					}
				}
				// Remove songs that were in "my library" but got deselected.
				next = next.filter((s) => {
					const idStr = String(s.id);
					// Only drop it if it was selected via the MultiSelect before
					// (i.e. it lives in mySongs). Songs not in the user's library
					// can only be removed via the trash button.
					if (!mySongs.some((ms) => ms.id === s.id)) return true;
					return nextSet.has(idStr);
				});
				return next;
			});
		},
		[songs, mySongs],
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

	/**
	 * Diffs the current staged `songs` against `initial.songs` and fires
	 * every add/remove API call needed to reach the staged state. Finishes
	 * with updatePlaylist (title/description) + saveOrder (reorder) in
	 * parallel. Only called when the user clicks Save changes.
	 */
	const onSaveMeta = useCallback(async () => {
		const initialIds = new Set((initial.songs ?? []).map((s) => s.id));
		const currentIds = new Set(songs.map((s) => s.id));

		const toAdd = [...currentIds].filter((id) => !initialIds.has(id));
		const toRemove = [...initialIds].filter((id) => !currentIds.has(id));

		// Run adds/removes sequentially — SWR mutation hooks aren't safe to
		// fan out in parallel because each one bumps a shared cache.
		for (const id of toAdd) await addSongToPlaylist(initial.playlistId, id);
		for (const id of toRemove) await removeSongFromPlaylist(initial.playlistId, id);

		const orderedIds = songs.map((s) => s.id);
		await Promise.all([
			updatePlaylist(initial.playlistId, { title, description }),
			saveOrder(initial.playlistId, orderedIds),
		]);
		setEditing(false);
	}, [
		songs,
		initial.songs,
		initial.playlistId,
		addSongToPlaylist,
		removeSongFromPlaylist,
		updatePlaylist,
		title,
		description,
		saveOrder,
	]);

	const onCancelMeta = useCallback(() => {
		setTitle(initial.title);
		setDescription(initial.description ?? '');
		setSongs(initial.songs ?? []);
		setEditing(false);
	}, [initial.title, initial.description, initial.songs]);

	const togglePin = useCallback(async () => {
		const next = !pinned;
		setPinned(next);
		try {
			await setPinnedReq(initial.playlistId, next);
		} catch {
			setPinned(!next);
		}
	}, [pinned, setPinnedReq, initial.playlistId]);

	/**
	 * Trash-button removal. Purely local — just drops the song from the
	 * staged list. No confirmation popup, no backend call. The actual
	 * removal happens when the user clicks Save.
	 */
	const removeSongByButton = useCallback((songId: number) => {
		setSongs((prev) => prev.filter((s) => s.id !== songId));
	}, []);

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
