import { Button, Group, MultiSelect, TextInput } from '@mantine/core';

interface MySongsToolbarProps {
	query: string;
	onQueryChange: (next: string) => void;
	onNewSong: () => void;
	selectedCount: number;
	isDeleting: boolean;
	isMobile: boolean;
	onDeleteSelected: () => void;
	availableTags: string[];
	selectedTags: string[];
	onTagsChange: (next: string[]) => void;
}

/**
 * Top toolbar on the My Songs page. Left side is the filter input and
 * tag picker; right side is "New Song" plus (desktop-only) a bulk Delete
 * button. Bulk actions are hidden on mobile because the underlying
 * DataTable doesn't expose row selection on touch devices.
 */
export function MySongsToolbar({
	query,
	onQueryChange,
	onNewSong,
	selectedCount,
	isDeleting,
	isMobile,
	onDeleteSelected,
	availableTags,
	selectedTags,
	onTagsChange,
}: MySongsToolbarProps) {
	return (
		<Group justify="space-between" wrap="wrap" gap="xs">
			<Group gap="xs" style={{ flex: '1 1 320px', minWidth: 0 }} wrap="wrap">
				<TextInput
					placeholder="Filter by name…"
					value={query}
					onChange={(e) => onQueryChange(e.currentTarget.value)}
					w={{ base: '100%', sm: 240 }}
					flex={{ base: '1 0 100%', sm: '0 1 240px' }}
				/>
				<MultiSelect
					placeholder={selectedTags.length === 0 ? 'Filter by tags…' : ''}
					data={availableTags}
					value={selectedTags}
					onChange={onTagsChange}
					searchable
					clearable
					nothingFoundMessage="No tags"
					disabled={availableTags.length === 0}
					w={{ base: '100%', sm: 240 }}
					flex={{ base: '1 0 100%', sm: '0 1 240px' }}
				/>
			</Group>
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
