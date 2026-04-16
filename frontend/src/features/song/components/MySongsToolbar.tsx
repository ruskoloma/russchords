import { Button, Group, TextInput } from '@mantine/core';

interface MySongsToolbarProps {
	query: string;
	onQueryChange: (next: string) => void;
	onNewSong: () => void;
	selectedCount: number;
	isDeleting: boolean;
	isMobile: boolean;
	onDeleteSelected: () => void;
}

/**
 * Top toolbar on the My Songs page. Left side is the filter input; right
 * side is "New Song" plus (desktop-only) a bulk Delete button. Bulk
 * actions are hidden on mobile because the underlying DataTable doesn't
 * expose row selection on touch devices.
 */
export function MySongsToolbar({
	query,
	onQueryChange,
	onNewSong,
	selectedCount,
	isDeleting,
	isMobile,
	onDeleteSelected,
}: MySongsToolbarProps) {
	return (
		<Group justify="space-between" wrap="wrap" gap="xs">
			<TextInput
				placeholder="Filter by name…"
				value={query}
				onChange={(e) => onQueryChange(e.currentTarget.value)}
				w={{ base: '100%', sm: 320 }}
				flex={{ base: '1 0 100%', sm: '0 1 320px' }}
			/>
			<Group gap="xs">
				<Button onClick={onNewSong}>New song</Button>
				{!isMobile && (
					<Button
						variant="light"
						color="red"
						disabled={selectedCount === 0 || isDeleting}
						onClick={onDeleteSelected}
						loading={isDeleting}
					>
						Delete ({selectedCount})
					</Button>
				)}
			</Group>
		</Group>
	);
}
