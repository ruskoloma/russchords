import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Checkbox, Chip, CloseButton, Group, ScrollArea, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { queryClient } from '../../../app/queryClient';
import { songQuery } from '../../../api/songs';
import { KeyBadge } from '../../../components/KeyBadge';
import { usePersistentState } from '../../../lib/storage';
import { withSource } from '../../../lib/navigation';
import { normalizeSearch } from '../../../lib/text';

export interface SongListEntry {
	id: number;
	name: string;
	artist?: string | null;
	rootNote?: string | null;
	tags?: string[];
}

export type SongSort = 'recent' | 'name' | 'artist';

interface SongListProps<T extends SongListEntry> {
	songs: T[];
	/** Session-storage namespace for the filter/sort state. */
	stateKey: string;
	sortOptions?: Array<{ value: SongSort; label: string }>;
	/** Enables checkboxes; the parent renders actions for the selected songs. */
	selectable?: boolean;
	selectedIds?: Set<number>;
	onToggleSelected?: (id: number) => void;
	/** Extra element at the end of each row (e.g. an unstar button). */
	renderTrailing?: (song: T) => ReactNode;
	emptyFilterText?: string;
	/** Rendered above the list, next to the search field. */
	toolbarExtra?: ReactNode;
}

interface ListState {
	query: string;
	sort: SongSort;
	tags: string[];
}

const PAGE = 60;

function prefetchSong(id: number) {
	void queryClient.prefetchQuery({ ...songQuery(id), staleTime: 60_000 });
}

interface RowProps {
	song: SongListEntry;
	href: string;
	selectable: boolean;
	selected: boolean;
	onToggle?: (id: number) => void;
	trailing?: ReactNode;
}

const SongRow = memo(function SongRow({ song, href, selectable, selected, onToggle, trailing }: RowProps) {
	const main = (
		<>
			<div className="list-row__main">
				<Text fw={600} truncate>
					{song.name || 'Untitled'}
				</Text>
				{(song.artist || (song.tags && song.tags.length > 0)) && (
					<Group gap={6} wrap="nowrap" style={{ overflow: 'hidden' }}>
						{song.artist && (
							<Text size="sm" c="dimmed" truncate style={{ flexShrink: 1 }}>
								{song.artist}
							</Text>
						)}
						{song.tags?.slice(0, 3).map((t) => (
							<Badge key={t} size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>
								{t}
							</Badge>
						))}
					</Group>
				)}
			</div>
			<KeyBadge value={song.rootNote} />
		</>
	);

	if (selectable) {
		return (
			<div
				className="list-row"
				data-clickable="true"
				data-selected={selected}
				role="checkbox"
				aria-checked={selected}
				tabIndex={0}
				onClick={() => onToggle?.(song.id)}
				onKeyDown={(e) => {
					if (e.key === ' ' || e.key === 'Enter') {
						e.preventDefault();
						onToggle?.(song.id);
					}
				}}
			>
				<Checkbox checked={selected} readOnly tabIndex={-1} aria-hidden size="md" />
				{main}
			</div>
		);
	}

	const link = (
		<Link
			to={href}
			className={trailing ? 'list-row__link' : 'list-row'}
			onPointerEnter={() => prefetchSong(song.id)}
			onTouchStart={() => prefetchSong(song.id)}
			onFocus={() => prefetchSong(song.id)}
		>
			{main}
		</Link>
	);

	if (!trailing) return link;

	// Keep the trailing control outside the link (no nested interactive elements).
	return (
		<div className="list-row" data-clickable="true">
			{link}
			{trailing}
		</div>
	);
});

/**
 * Searchable, sortable, tag-filterable song list. Filter state survives
 * navigation for the browser session; long lists render progressively.
 */
export function SongList<T extends SongListEntry>({
	songs,
	stateKey,
	sortOptions = [
		{ value: 'recent', label: 'Recent' },
		{ value: 'name', label: 'Name' },
		{ value: 'artist', label: 'Artist' },
	],
	selectable = false,
	selectedIds,
	onToggleSelected,
	renderTrailing,
	emptyFilterText = 'No songs match your filter.',
	toolbarExtra,
}: SongListProps<T>) {
	const location = useLocation();
	const [state, setState] = usePersistentState<ListState>(
		`russchords:list:${stateKey}`,
		{ query: '', sort: sortOptions[0].value, tags: [] },
		{
			kind: 'session',
			sanitize: (raw) => {
				const r = (raw ?? {}) as Partial<ListState>;
				return {
					query: typeof r.query === 'string' ? r.query : '',
					sort: sortOptions.some((o) => o.value === r.sort) ? (r.sort as SongSort) : sortOptions[0].value,
					tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : [],
				};
			},
		},
	);
	const deferredQuery = useDeferredValue(state.query);

	const allTags = useMemo(() => {
		const seen = new Map<string, string>();
		for (const s of songs) for (const t of s.tags ?? []) if (!seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
		return [...seen.values()].sort((a, b) => a.localeCompare(b));
	}, [songs]);

	const activeTags = state.tags.filter((t) => allTags.some((a) => a.toLowerCase() === t.toLowerCase()));

	const filtered = useMemo(() => {
		const q = normalizeSearch(deferredQuery.trim());
		const tagSet = activeTags.map((t) => t.toLowerCase());
		let result = songs.filter((s) => {
			if (tagSet.length > 0) {
				const own = (s.tags ?? []).map((t) => t.toLowerCase());
				if (!tagSet.every((t) => own.includes(t))) return false;
			}
			if (!q) return true;
			const haystack = normalizeSearch(`${s.name} ${s.artist ?? ''} ${(s.tags ?? []).join(' ')}`);
			return q.split(/\s+/).every((part) => haystack.includes(part));
		});
		if (state.sort !== 'recent') {
			const field = state.sort;
			result = [...result].sort((a, b) =>
				(a[field] ?? '').localeCompare(b[field] ?? '', undefined, { sensitivity: 'base' }),
			);
		}
		return result;
	}, [songs, deferredQuery, activeTags, state.sort]);

	// Progressive rendering for long libraries.
	const [limit, setLimit] = useState(PAGE);
	useEffect(() => setLimit(PAGE), [deferredQuery, state.sort, state.tags]);
	const sentinel = useRef<HTMLDivElement>(null);
	const hasMore = filtered.length > limit;
	useEffect(() => {
		const el = sentinel.current;
		if (!el || !hasMore) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE);
			},
			{ rootMargin: '600px' },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [hasMore, limit]);

	const toggleTag = (tag: string) =>
		setState((prev) => {
			const has = prev.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
			return {
				...prev,
				tags: has ? prev.tags.filter((t) => t.toLowerCase() !== tag.toLowerCase()) : [...prev.tags, tag],
			};
		});

	const visible = filtered.slice(0, limit);
	const isFiltering = Boolean(state.query.trim()) || activeTags.length > 0;

	return (
		<Stack gap="sm">
			<Group gap="xs" wrap="nowrap" align="flex-end">
				<TextInput
					placeholder="Search songs"
					aria-label="Filter songs"
					value={state.query}
					onChange={(e) => {
						const query = e.currentTarget.value;
						setState((prev) => ({ ...prev, query }));
					}}
					leftSection={<IconSearch size={16} />}
					rightSection={
						state.query ? (
							<CloseButton aria-label="Clear search" onClick={() => setState((prev) => ({ ...prev, query: '' }))} />
						) : null
					}
					style={{ flex: 1 }}
				/>
				{sortOptions.length > 1 && (
					<Select
						aria-label="Sort by"
						data={sortOptions}
						value={state.sort}
						onChange={(v) => v && setState((prev) => ({ ...prev, sort: v as SongSort }))}
						w={{ base: 130, sm: 170 }}
						comboboxProps={{ position: 'bottom-end', width: 180 }}
					/>
				)}
				{toolbarExtra}
			</Group>

			{allTags.length > 0 && (
				<ScrollArea type="never" offsetScrollbars={false}>
					<Group gap={6} wrap="nowrap" pb={2}>
						{allTags.map((tag) => (
							<Chip
								key={tag}
								size="sm"
								variant="light"
								checked={activeTags.some((t) => t.toLowerCase() === tag.toLowerCase())}
								onChange={() => toggleTag(tag)}
							>
								{tag}
							</Chip>
						))}
					</Group>
				</ScrollArea>
			)}

			{visible.length === 0 ? (
				<Text c="dimmed" ta="center" py="xl">
					{emptyFilterText}
				</Text>
			) : (
				<div className="list-surface">
					{visible.map((song) => (
						<SongRow
							key={song.id}
							song={song}
							href={withSource(`/song/${song.id}`, location)}
							selectable={selectable}
							selected={selectedIds?.has(song.id) ?? false}
							onToggle={onToggleSelected}
							trailing={renderTrailing?.(song)}
						/>
					))}
				</div>
			)}
			<div ref={sentinel} />
			<Text size="xs" c="dimmed" ta="center">
				{isFiltering
					? `${filtered.length} of ${songs.length} songs`
					: `${songs.length} song${songs.length === 1 ? '' : 's'}`}
			</Text>
		</Stack>
	);
}
