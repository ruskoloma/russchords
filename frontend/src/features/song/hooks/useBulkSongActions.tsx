import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { useDeleteSongs } from './song';
import { useStarSongs } from './starred';
import type { LiteSongDto } from '../../../types';

interface Options {
	onAfterDelete: (deletedIds: number[]) => void;
	onAfterStar: () => void;
}

/**
 * Bulk delete + star confirmation flows for the My Songs page. Exposes
 * imperative handlers that open a Mantine confirmation modal, run the
 * mutation, and dispatch caller-provided after-hooks so the page can
 * update its table state without this hook having to know about it.
 */
export function useBulkSongActions({ onAfterDelete, onAfterStar }: Options) {
	const { deleteSongs, isDeleting } = useDeleteSongs();
	const { starSongs, isStarring } = useStarSongs();

	const confirmDelete = (selected: LiteSongDto[]) => {
		if (selected.length === 0) return;
		modals.openConfirmModal({
			title: 'Confirm deletion',
			children: <Text size="sm">Are you sure you want to delete {selected.length} song(s)?</Text>,
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: async () => {
				const ids = selected.map((r) => r.id);
				const deletedIds = await deleteSongs(ids);
				onAfterDelete(deletedIds);
			},
		});
	};

	const confirmStar = (selected: LiteSongDto[]) => {
		if (selected.length === 0) return;
		modals.openConfirmModal({
			title: 'Add to starred',
			children: <Text size="sm">Star {selected.length} song(s)?</Text>,
			labels: { confirm: 'Star', cancel: 'Cancel' },
			confirmProps: { color: 'accent', loading: isStarring },
			onConfirm: async () => {
				const ids = selected.map((r) => r.id);
				await starSongs(ids);
				onAfterStar();
			},
		});
	};

	return {
		confirmDelete,
		confirmStar,
		isDeleting,
		isStarring,
	};
}
