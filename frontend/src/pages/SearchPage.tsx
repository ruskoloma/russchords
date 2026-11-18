import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
	ActionIcon,
	Alert,
	Button,
	Card,
	Code,
	Group,
	Loader,
	Pagination,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Title,
	Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconExternalLink, IconLink, IconSearch } from '@tabler/icons-react';
import {
	holychordsIdFromUrl,
	importHolychordsSong,
	SEARCH_MAX_PAGES,
	SEARCH_PAGE_SIZE,
	useHolychordsSearch,
	type SearchItem,
} from '../api/holychords';
import { useMySongs } from '../api/songs';
import { useSession } from '../auth/useSession';
import { PageHeader } from '../components/PageHeader';
import { KeyBadge } from '../components/KeyBadge';
import { normalizeSearch } from '../lib/text';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifyError } from '../lib/notify';
import { withSource } from '../lib/navigation';

const numberFormat = new Intl.NumberFormat();

/** Cleans Google's result titles like "Song — Artist | holychords.pro". */
const cleanTitle = (title: string) => title.replace(/\s*[|–—-]\s*holychords.*$/i, '').trim() || title;

function useOpenHolychords() {
	const navigate = useNavigate();
	const location = useLocation();
	const [opening, setOpening] = useState<string | null>(null);

	const open = async (holychordsId: string) => {
		if (opening) return;
		setOpening(holychordsId);
		try {
			const songId = await importHolychordsSong(holychordsId);
			navigate(withSource(`/song/cached/${songId}`, location));
		} catch (err) {
			notifyError(err instanceof Error ? err.message : 'Could not open this song', 'Could not open the song');
			setOpening(null);
		}
	};

	return { opening, open };
}

const resultId = (link: string) => holychordsIdFromUrl(link) ?? link.split('/').filter(Boolean).at(-1) ?? '';

function ResultCard({
	item,
	isOpening,
	disabled,
	onOpen,
}: {
	item: SearchItem;
	isOpening: boolean;
	disabled: boolean;
	onOpen: (id: string) => void;
}) {
	const holychordsId = resultId(item.link);
	return (
		<Card padding={0} style={{ opacity: disabled && !isOpening ? 0.6 : 1 }}>
			<Group wrap="nowrap" gap={0} align="stretch">
				<button
					type="button"
					onClick={() => onOpen(holychordsId)}
					disabled={disabled}
					aria-busy={isOpening}
					style={{
						all: 'unset',
						flex: 1,
						minWidth: 0,
						padding: 'var(--mantine-spacing-md)',
						cursor: disabled ? 'progress' : 'pointer',
					}}
					className="clickable-card"
				>
					<Group gap="xs" wrap="nowrap">
						<Text fw={700} c="var(--mantine-primary-color-filled)" lineClamp={2}>
							{cleanTitle(item.title)}
						</Text>
						{isOpening && <Loader size="xs" />}
					</Group>
					<Text size="sm" c="dimmed" lineClamp={2} mt={4}>
						{item.snippet}
					</Text>
				</button>
				<Tooltip label="Open on holychords.pro">
					<ActionIcon
						component="a"
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
						size="xl"
						variant="subtle"
						aria-label="Open on holychords.pro"
						style={{ alignSelf: 'center', marginRight: 8 }}
					>
						<IconExternalLink size={18} />
					</ActionIcon>
				</Tooltip>
			</Group>
		</Card>
	);
}

function LibraryMatches({ query }: { query: string }) {
	const location = useLocation();
	const { data } = useMySongs();
	const matches = useMemo(() => {
		const q = normalizeSearch(query.trim());
		if (!q || !data) return [];
		return data
			.filter((s) => {
				const hay = normalizeSearch(`${s.name} ${s.artist ?? ''} ${(s.tags ?? []).join(' ')}`);
				return q.split(/\s+/).every((p) => hay.includes(p));
			})
			.slice(0, 5);
	}, [data, query]);

	if (matches.length === 0) return null;
	return (
		<Stack gap="xs">
			<Title order={3}>In your library</Title>
			<div className="list-surface">
				{matches.map((s) => (
					<Link key={s.id} to={withSource(`/song/${s.id}`, location)} className="list-row">
						<div className="list-row__main">
							<Text fw={600} truncate>
								{s.name}
							</Text>
							{s.artist && (
								<Text size="sm" c="dimmed" truncate>
									{s.artist}
								</Text>
							)}
						</div>
						<KeyBadge value={s.rootNote} />
					</Link>
				))}
			</div>
		</Stack>
	);
}

export function SearchPage() {
	const [params, setParams] = useSearchParams();
	const query = params.get('q')?.trim() ?? '';
	const page = Math.min(SEARCH_MAX_PAGES, Math.max(1, Number(params.get('page')) || 1));
	const [input, setInput] = useState(query);
	const { isSignedIn } = useSession();
	const { opening, open } = useOpenHolychords();
	usePageTitle(query ? `Search: ${query}` : 'Search');

	// Keep the field in sync with back/forward navigation.
	useEffect(() => setInput(query), [query]);

	const pastedId = holychordsIdFromUrl(input);
	const search = useHolychordsSearch(pastedId ? '' : query, page);
	const items = search.data?.items ?? [];
	const total = Number(search.data?.searchInformation?.totalResults ?? 0);
	const pages = Math.min(Math.ceil(total / SEARCH_PAGE_SIZE), SEARCH_MAX_PAGES);

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		const q = input.trim();
		if (!q) return;
		const id = holychordsIdFromUrl(q);
		if (id) {
			void open(id);
			return;
		}
		(document.activeElement as HTMLElement | null)?.blur();
		setParams(q ? { q } : {});
	};

	const goToPage = (p: number) => {
		setParams({ q: query, ...(p > 1 ? { page: String(p) } : {}) });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<>
			<PageHeader title="Search" subtitle="Songs from holychords.pro — or paste a holychords link" />
			<Stack gap="lg">
				<form onSubmit={onSubmit} role="search">
					<Group gap="xs" wrap="nowrap" align="flex-start">
						<TextInput
							aria-label="Search input"
							placeholder="Song title, artist or lyrics"
							size="md"
							value={input}
							onChange={(e) => setInput(e.currentTarget.value)}
							leftSection={pastedId ? <IconLink size={18} /> : <IconSearch size={18} />}
							style={{ flex: 1 }}
							autoFocus={!query}
							enterKeyHint="search"
						/>
						<Button type="submit" size="md" disabled={!input.trim()} loading={Boolean(pastedId && opening)}>
							{pastedId ? 'Open' : 'Search'}
						</Button>
					</Group>
				</form>

				{isSignedIn && query && <LibraryMatches query={query} />}

				{query && !pastedId && (
					<Stack gap="sm">
						{isSignedIn && <Title order={3}>On holychords.pro</Title>}
						{search.isPending ? (
							<Stack gap="sm">
								{Array.from({ length: 4 }, (_, i) => (
									<Skeleton key={i} height={88} radius="lg" />
								))}
							</Stack>
						) : search.error ? (
							<Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />} title="Search failed">
								<Stack gap="xs" align="flex-start">
									<Text size="sm">{search.error.message}</Text>
									<Button size="compact-sm" variant="light" color="red" onClick={() => void search.refetch()}>
										Try again
									</Button>
								</Stack>
							</Alert>
						) : items.length === 0 ? (
							<Text c="dimmed" py="md">
								Nothing found for “{query}”. Try fewer words or another spelling.
							</Text>
						) : (
							<>
								<Group justify="space-between">
									<Text size="sm" c="dimmed">
										About {numberFormat.format(total)} results
									</Text>
									{search.isFetching && <Loader size="xs" />}
								</Group>
								{items.map((item) => {
									const id = resultId(item.link);
									return (
										<ResultCard
											key={item.link}
											item={item}
											isOpening={opening !== null && opening === id}
											disabled={opening !== null}
											onOpen={(hid) => void open(hid)}
										/>
									);
								})}
								{pages > 1 && (
									<Group justify="center" mt="sm">
										<Pagination value={page} onChange={goToPage} total={pages} siblings={1} />
									</Group>
								)}
							</>
						)}
					</Stack>
				)}

				{!query && !pastedId && (
					<Text c="dimmed" size="sm">
						Type a song title, an artist or a line from the lyrics. You can also paste a link like{' '}
						<Code>holychords.pro/12345</Code>.
					</Text>
				)}
			</Stack>
		</>
	);
}
