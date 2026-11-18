import { useDeferredValue, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Group, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPinFilled, IconPlaylist, IconPlus, IconSearch, IconUsers } from '@tabler/icons-react';
import { useMyPlaylists } from '../api/playlists';
import { useSession } from '../auth/useSession';
import { PageHeader } from '../components/PageHeader';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { SignInRequired } from '../components/SignInRequired';
import { CreatePlaylistModal } from '../features/playlist/components/CreatePlaylistModal';
import { normalizeSearch } from '../lib/text';
import { usePageTitle } from '../hooks/usePageTitle';
import { usePersistentState } from '../lib/storage';
import type { MyPlaylistDto } from '../types';
import { Skeleton } from '@mantine/core';

type SortKey = 'new' | 'old' | 'alpha';

const createdOrder = (p: MyPlaylistDto) => (p.createdAt ? Date.parse(p.createdAt) : p.playlistId);

function PlaylistCard({ playlist, isOwner }: { playlist: MyPlaylistDto; isOwner: boolean }) {
	const preview = playlist.songs.slice(0, 4);
	const more = playlist.songs.length - preview.length;
	return (
		<Card component={Link} to={`/playlist/${playlist.playlistId}`} className="clickable-card" h="100%">
			<Stack gap="xs" h="100%">
				<Group justify="space-between" wrap="nowrap" align="flex-start" gap="xs">
					<Text fw={700} size="lg" lineClamp={2} style={{ overflowWrap: 'anywhere' }}>
						{playlist.title}
					</Text>
					{playlist.isPinned && (
						<IconPinFilled
							size={18}
							style={{ color: 'var(--mantine-primary-color-filled)', flexShrink: 0 }}
							aria-label="Pinned"
						/>
					)}
				</Group>
				<Group gap={6}>
					<Badge variant="light" color="gray">
						{playlist.songs.length} song{playlist.songs.length === 1 ? '' : 's'}
					</Badge>
					{!isOwner && (
						<Badge variant="light" color="blue" leftSection={<IconUsers size={12} />}>
							Shared with you
						</Badge>
					)}
				</Group>
				{preview.length > 0 ? (
					<Stack gap={2} mt={4}>
						{preview.map((s, i) => (
							<Text key={s.id} size="sm" c="dimmed" truncate>
								{i + 1}. {s.name}
							</Text>
						))}
						{more > 0 && (
							<Text size="xs" c="dimmed">
								+{more} more
							</Text>
						)}
					</Stack>
				) : (
					<Text size="sm" c="dimmed" fs="italic">
						No songs yet
					</Text>
				)}
			</Stack>
		</Card>
	);
}

export function PlaylistsPage() {
	usePageTitle('Playlists');
	const navigate = useNavigate();
	const { isSignedIn, userId } = useSession();
	const { data: playlists, isPending, error, refetch } = useMyPlaylists();
	const [createOpened, createModal] = useDisclosure(false);
	const [sort, setSort] = usePersistentState<SortKey>('russchords-my-playlists-sort', 'new', {
		sanitize: (raw) => (raw === 'alpha' || raw === 'old' || raw === 'new' ? raw : 'new'),
	});
	const [query, setQuery] = usePersistentState('russchords:list:playlists', '', {
		kind: 'session',
		sanitize: (raw) => (typeof raw === 'string' ? raw : ''),
	});
	const deferredQuery = useDeferredValue(query);

	const sorted = useMemo(() => {
		const q = normalizeSearch(deferredQuery.trim());
		const list = (playlists ?? []).filter((p) => !q || normalizeSearch(p.title).includes(q));
		return list.sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			if (sort === 'alpha') return a.title.localeCompare(b.title);
			return sort === 'new' ? createdOrder(b) - createdOrder(a) : createdOrder(a) - createdOrder(b);
		});
	}, [playlists, sort, deferredQuery]);

	if (!isSignedIn) return <SignInRequired description="Build set lists for services and share them with your team." />;

	return (
		<>
			<PageHeader
				title="Playlists"
				actions={
					<Button leftSection={<IconPlus size={18} />} onClick={createModal.open}>
						New playlist
					</Button>
				}
			/>
			<CreatePlaylistModal
				opened={createOpened}
				onClose={createModal.close}
				onCreated={(p) => navigate(`/playlist/${p.id}`, { state: { startEditing: true } })}
			/>

			{isPending ? (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{Array.from({ length: 6 }, (_, i) => (
						<Skeleton key={i} height={170} radius="lg" />
					))}
				</SimpleGrid>
			) : error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : playlists.length === 0 ? (
				<EmptyState
					icon={<IconPlaylist size={28} />}
					title="No playlists yet"
					description="Create a set list for your next service, then open it on Stage for a distraction-free view."
					action={
						<Button leftSection={<IconPlus size={18} />} onClick={createModal.open}>
							New playlist
						</Button>
					}
				/>
			) : (
				<Stack gap="md">
					<Group gap="xs" wrap="nowrap">
						<TextInput
							aria-label="Filter playlists"
							placeholder="Search playlists"
							leftSection={<IconSearch size={16} />}
							value={query}
							onChange={(e) => setQuery(e.currentTarget.value)}
							style={{ flex: 1 }}
						/>
						<Select
							aria-label="Sort playlists"
							value={sort}
							onChange={(v) => v && setSort(v as SortKey)}
							data={[
								{ value: 'new', label: 'Newest first' },
								{ value: 'old', label: 'Oldest first' },
								{ value: 'alpha', label: 'A–Z' },
							]}
							w={{ base: 140, sm: 170 }}
						/>
					</Group>
					{sorted.length === 0 ? (
						<Text c="dimmed" ta="center" py="xl">
							No playlists match “{query}”.
						</Text>
					) : (
						<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
							{sorted.map((p) => (
								<PlaylistCard key={p.playlistId} playlist={p} isOwner={p.ownerId === userId} />
							))}
						</SimpleGrid>
					)}
				</Stack>
			)}
		</>
	);
}
