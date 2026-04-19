import { Card, Group, Loader, Stack, Text } from '@mantine/core';
import { MrBeanLoader } from '../../components';
import { SearchForm } from '../../features/search/components/SearchForm';
import { SearchResultsList } from '../../features/search/components/SearchResultsList';
import { useSiteSearch } from '../../features/search/hooks/useSiteSearch';
import { useHolychordsRedirect } from '../../features/search/hooks/useHolychordsRedirect';

/**
 * Thin composition over the `features/search` hooks and components.
 * Owns no state beyond what the two hooks return.
 */
export const SearchPage = () => {
	const { q, setQ, submit, goToPage, data, error, isLoading, totalResults, totalPages, currentPage, urlQuery } =
		useSiteSearch();
	const { redirectingLink, redirectToSong } = useHolychordsRedirect();

	// Full-screen Mr. Bean loader while we're bouncing the user through the
	// Lambda → cached song flow.
	if (redirectingLink !== null) {
		return <MrBeanLoader />;
	}

	const hasResults = Boolean(data?.items && data.items.length > 0);
	const showEmptyMessage = !isLoading && !hasResults && q.trim() && !!urlQuery;

	return (
		<Stack gap="md">
			<SearchForm value={q} onChange={setQ} onSubmit={submit} />

			{isLoading && (
				<Group>
					<Loader size="sm" />
					<Text size="sm">Searching…</Text>
				</Group>
			)}

			{error && (
				<Card withBorder>
					<Text c="red">{error.message || 'Search failed'}</Text>
				</Card>
			)}

			{hasResults && (
				<SearchResultsList
					items={data!.items!}
					totalResults={totalResults}
					totalPages={totalPages}
					currentPage={currentPage}
					redirectingLink={redirectingLink}
					onOpen={redirectToSong}
					onPageChange={goToPage}
				/>
			)}

			{showEmptyMessage && (
				<Text c="dimmed" size="sm">
					No results found for "{q}".
				</Text>
			)}

			{!hasResults && !isLoading && !showEmptyMessage && (
				<Text c="dimmed" size="sm">
					No results yet. Try a search above.
				</Text>
			)}
		</Stack>
	);
};
