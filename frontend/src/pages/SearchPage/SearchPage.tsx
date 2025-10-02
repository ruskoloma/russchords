import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Anchor, Button, Card, Group, Loader, Pagination, Stack, Text, TextInput } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import useSWR from 'swr';
import { type SearchItem, type SearchResponse, searchSite } from '../../hooks/search';
import { PAGE_SIZE, parserDomain } from '../../constants/search.ts';
import { MrBeanLoader } from '../../components';

export const SearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const [q, setQ] = useState('');
	const [startIndex, setStartIndex] = useState<number | undefined>(undefined);
	const [redirectingLink, setRedirectingLink] = useState<string | null>(null);

	// Create a cache key for SWR
	const cacheKey = q.trim() ? `search-${q.trim()}-${startIndex || 1}` : null;

	// Use SWR for data fetching with caching
	const { data, error, isLoading } = useSWR<SearchResponse>(
		cacheKey,
		() => searchSite(q.trim(), startIndex),
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 60000, // 1 minute deduplication
		}
	);

	const totalResults = useMemo(() => Number(data?.searchInformation?.totalResults || 0), [data]);
	const totalPages = useMemo(() => {
		if (!totalResults) return 0;
		return Math.min(Math.ceil(totalResults / PAGE_SIZE), 10); // cap to avoid giant pagination
	}, [totalResults]);

	const currentPage = useMemo(() => {
		if (!startIndex) return 1;
		return Math.floor(((startIndex || 1) - 1) / PAGE_SIZE) + 1;
	}, [startIndex]);

	const doSearch = useCallback(
		(opts?: { resetPage?: boolean }) => {
			if (!q.trim()) return;

			// Update URL parameters
			const newParams = new URLSearchParams(searchParams);
			newParams.set('q', q.trim());

			if (opts?.resetPage) {
				setStartIndex(undefined);
				newParams.delete('start');
			} else if (startIndex) {
				newParams.set('start', startIndex.toString());
			}

			setSearchParams(newParams);
		},
		[q, startIndex, searchParams, setSearchParams],
	);

	// Initialize state from URL parameters on mount
	useEffect(() => {
		const urlQuery = searchParams.get('q');
		const urlStart = searchParams.get('start');

		if (urlQuery) {
			setQ(urlQuery);
		}

		if (urlStart) {
			const startNum = parseInt(urlStart, 10);
			if (!isNaN(startNum)) {
				setStartIndex(startNum);
			}
		}
	}, [searchParams]);

	const onTitleClick = async (originalLink: string) => {
		if (!parserDomain) {
			showNotification({ title: 'Cannot open', message: 'Parser domain is not configured', color: 'red' });
			return;
		}
		if (redirectingLink) return; // prevent double-clicks while in-flight
		try {
			setRedirectingLink(originalLink);
			const songId = originalLink.split('/').at(-1);
			const lambdaUrl = `https://${parserDomain}/${songId}?client_mode=true`;

			const response = await fetch(lambdaUrl, { method: 'GET' });
			const data = await response.json();

			if (response.ok && data.songId) {
				navigate(`/song/cached/${data.songId}`);
			} else {
				throw new Error(data.error || 'Failed to get song info');
			}
		} catch (e: unknown) {
			setRedirectingLink(null);
			const msg = e instanceof Error ? e.message : 'Unknown error';
			console.error('[onTitleClick] redirect failed:', e);
			showNotification({ title: 'Failed to open', message: msg, color: 'red' });
		}
	};

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setStartIndex(undefined);
		void doSearch({ resetPage: true });
	};

	const onPageChange = (page: number) => {
		const newStart = (page - 1) * PAGE_SIZE + 1;
		setStartIndex(newStart);

		// Update URL parameters for pagination
		const newParams = new URLSearchParams(searchParams);
		if (newStart > 1) {
			newParams.set('start', newStart.toString());
		} else {
			newParams.delete('start');
		}
		setSearchParams(newParams);
	};

	if (redirectingLink !== null) {
		return <MrBeanLoader />;
	}

	return (
		<Stack gap="md">
			<form onSubmit={onSubmit}>
				<Group align="end" wrap="wrap">
					<TextInput
						label="Search holychords.pro"
						placeholder="Type your query"
						value={q}
						onChange={(e) => setQ(e.currentTarget.value)}
						w={480}
						leftSection={<IconSearch size={16} />}
						aria-label="Search input"
					/>
					<Button type="submit" leftSection={<IconSearch size={16} />} disabled={!q.trim()}>
						Search
					</Button>
				</Group>
			</form>

			{isLoading && (
				<Group>
					<Loader size="sm" />
					<Text size="sm">Searching…</Text>
				</Group>
			)}

			{error && (
				<Card withBorder color="red">
					<Text c="red">{error.message || 'Search failed'}</Text>
				</Card>
			)}

			{data?.items && data.items.length > 0 && (
				<Stack gap="sm">
					<Text size="sm" c="dimmed">
						Found ~{new Intl.NumberFormat().format(totalResults)} results
					</Text>
					{data.items.map((it: SearchItem, idx: number) => (
						<Card key={`${it.link}-${idx}`} withBorder>
							<Stack gap={4}>
								<Group gap={6} align="center" wrap="nowrap">
									<Text
										fw={600}
										onClick={() => onTitleClick(it.link)}
										style={{
											cursor: redirectingLink ? 'progress' : 'pointer',
											color: 'blue',
											opacity: redirectingLink === it.link ? 0.6 : 1,
										}}
										role="button"
										tabIndex={0}
										aria-busy={redirectingLink === it.link}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') onTitleClick(it.link);
										}}
									>
										{it.title}
									</Text>
									{redirectingLink === it.link && <Loader size="xs" />}
								</Group>
								<Anchor
									href={it.link}
									target="_blank"
									rel="noopener noreferrer"
									data-disabled={!!redirectingLink}
									style={{ pointerEvents: redirectingLink ? 'none' : 'auto' }}
								>
									<Text size="sm" c="dimmed">
										{it.link}
									</Text>
								</Anchor>
								<Text>{it.snippet}</Text>
							</Stack>
						</Card>
					))}

					{totalPages > 1 && <Pagination value={currentPage} onChange={onPageChange} total={totalPages} />}
				</Stack>
			)}

			{!isLoading && (!data?.items || data.items.length === 0) && q.trim() && (
				<Text c="dimmed" size="sm">
					No results found for "{q}".
				</Text>
			)}

			{!isLoading && !q.trim() && (
				<Text c="dimmed" size="sm">
					No results yet. Try a search above.
				</Text>
			)}
		</Stack>
	);
};
