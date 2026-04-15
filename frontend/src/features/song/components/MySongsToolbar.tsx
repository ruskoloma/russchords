import { ActionIcon, Button, Group, TextInput } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';

interface MySongsToolbarProps {
	query: string;
	onQueryChange: (next: string) => void;
	onNewSong: () => void;
	selectedCount: number;
	isDeleting: boolean;
	isStarring: boolean;
	isMobile: boolean;
	onDeleteSelected: () => void;
	onStarSelected: () => void;
}

/**
 * Top toolbar on the My Songs page. Left side is the filter input; right
 * side is "New Song" plus (desktop-only) bulk Delete and Star buttons. Bulk
 * actions are hidden on mobile because the underlying DataTable doesn't
 * expose row selection on touch devices.
 */
export function MySongsToolbar({
	query,
	onQueryChange,
	onNewSong,
	selectedCount,
	isDeleting,
	isStarring,
	isMobile,
	onDeleteSelected,
	onStarSelected,
}: MySongsToolbarProps) {
	return (
		<Group justify="space-between" wrap="wrap">
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
					<>
						<Button
							variant="light"
							color="red"
							disabled={selectedCount === 0 || isDeleting}
							onClick={onDeleteSelected}
							loading={isDeleting}
						>
							Delete ({selectedCount})
						</Button>
						<ActionIcon
							disabled={selectedCount === 0 || isStarring}
							variant="filled"
							color="accent"
							onClick={onStarSelected}
							loading={isStarring}
							aria-label="Star selected"
							size="lg"
						>
							<IconStar size={20} />
						</ActionIcon>
					</>
				)}
			</Group>
		</Group>
	);
}
