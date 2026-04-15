import { Pagination, Stack, Text } from '@mantine/core';
import type { SearchItem } from '../hooks/search';
import { SearchResultCard } from './SearchResultCard';

interface SearchResultsListProps {
	items: SearchItem[];
	totalResults: number;
	totalPages: number;
	currentPage: number;
	redirectingLink: string | null;
	onOpen: (link: string) => void;
	onPageChange: (page: number) => void;
}

/**
 * Presentational list of search results with the "Found ~N results" summary
 * line and a Mantine pagination control at the bottom when there are more
 * than one page.
 */
export function SearchResultsList({
	items,
	totalResults,
	totalPages,
	currentPage,
	redirectingLink,
	onOpen,
	onPageChange,
}: SearchResultsListProps) {
	if (items.length === 0) return null;

	return (
		<Stack gap="sm">
			<Text size="sm" c="dimmed">
				Found ~{new Intl.NumberFormat().format(totalResults)} results
			</Text>
			{items.map((item) => (
				<SearchResultCard
					key={item.link}
					item={item}
					isRedirecting={redirectingLink === item.link}
					isBusy={redirectingLink !== null}
					onOpen={onOpen}
				/>
			))}
			{totalPages > 1 && <Pagination value={currentPage} onChange={onPageChange} total={totalPages} />}
		</Stack>
	);
}
