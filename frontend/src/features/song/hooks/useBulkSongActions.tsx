import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { useDeleteSongs } from './song';
import type { LiteSongDto } from '../../../types';

interface Options {
	onAfterDelete: (deletedIds: number[]) => void;
}

/**
 * Bulk delete confirmation flow for the My Songs page. Exposes an
 * imperative `confirmDelete` handler that opens a Mantine confirmation
 * modal, runs the mutation, and dispatches the caller-provided
 * `onAfterDelete` hook so the page can update its table state without
 * this hook having to know about it.
 */
export function useBulkSongActions({ onAfterDelete }: Options) {
	const { deleteSongs, isDeleting } = useDeleteSongs();

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

	return {
		confirmDelete,
		isDeleting,
	};
}
