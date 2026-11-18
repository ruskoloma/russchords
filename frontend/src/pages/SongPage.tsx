import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import { ActionIcon, Badge, Button, Card, Group, Menu, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconCopy, IconDotsVertical, IconPencil, IconPrinter, IconShare, IconTrash } from '@tabler/icons-react';
import { useCloneSong, useDeleteSongs, useIsSongOwner, useSong } from '../api/songs';
import { isNotFound } from '../api/client';
import { useSession } from '../auth/useSession';
import { BackLink } from '../components/BackLink';
import { PageHeader } from '../components/PageHeader';
import { SongSkeleton } from '../components/ListSkeleton';
import { ErrorState } from '../components/ErrorState';
import { NotFound } from '../components/NotFound';
import { KeyBadge } from '../components/KeyBadge';
import { SourceLinkCard } from '../components/SourceLinkCard';
import { confirmAction } from '../components/confirm';
import { SongViewer } from '../features/song/components/SongViewer';
import { StarButton } from '../features/song/components/StarButton';
import { AddToPlaylistButton } from '../features/playlist/components/PlaylistPicker';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifySuccess, shareLink } from '../lib/notify';
import type { SongDto } from '../types';

function SongActions({ song }: { song: SongDto }) {
	const navigate = useNavigate();
	const { isSignedIn } = useSession();
	const isOwner = useIsSongOwner(song);
	const clone = useCloneSong();
	const remove = useDeleteSongs();
	const isNarrow = useMediaQuery('(max-width: 30em)', false, { getInitialValueInEffect: false });

	const onClone = async () => {
		const created = await clone.mutateAsync(song.id);
		notifySuccess('A copy was added to your songs');
		navigate(`/song/${created.id}`);
	};

	const onDelete = async () => {
		const ok = await confirmAction({
			title: 'Delete song?',
			message: `“${song.name}” will be removed from your songs and from your playlists.`,
			confirmLabel: 'Delete',
			danger: true,
		});
		if (!ok) return;
		await remove.mutateAsync([song.id]);
		notifySuccess('Song deleted');
		navigate('/my-songs', { replace: true });
	};

	return (
		<Group gap="xs" wrap="wrap" className="no-print">
			{isSignedIn && <StarButton song={song} />}
			{isSignedIn && (
				<AddToPlaylistButton
					song={{
						id: song.id,
						name: song.name,
						artist: song.artist ?? null,
						rootNote: song.rootNote ?? null,
						sourceUrl: song.sourceUrl ?? null,
						tags: song.tags ?? [],
					}}
				/>
			)}
			{isOwner &&
				(isNarrow ? (
					<Tooltip label="Edit">
						<ActionIcon component={Link} to={`/song/edit/${song.id}`} size="lg" variant="default" aria-label="Edit">
							<IconPencil size={18} />
						</ActionIcon>
					</Tooltip>
				) : (
					<Button
						component={Link}
						to={`/song/edit/${song.id}`}
						variant="default"
						leftSection={<IconPencil size={18} />}
					>
						Edit
					</Button>
				))}
			<Tooltip label="Share link">
				<ActionIcon size="lg" variant="default" onClick={() => void shareLink(song.name)} aria-label="Share link">
					<IconShare size={18} />
				</ActionIcon>
			</Tooltip>
			<Menu position="bottom-end" width={220}>
				<Menu.Target>
					<ActionIcon size="lg" variant="default" aria-label="More actions">
						<IconDotsVertical size={18} />
					</ActionIcon>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
						Print / save as PDF
					</Menu.Item>
					{isSignedIn && (
						<Menu.Item leftSection={<IconCopy size={16} />} onClick={() => void onClone()} disabled={clone.isPending}>
							{isOwner ? 'Duplicate' : 'Copy to my songs'}
						</Menu.Item>
					)}
					{isOwner && (
						<>
							<Menu.Divider />
							<Menu.Item
								color="red"
								leftSection={<IconTrash size={16} />}
								onClick={() => void onDelete()}
								disabled={remove.isPending}
							>
								Delete
							</Menu.Item>
						</>
					)}
				</Menu.Dropdown>
			</Menu>
		</Group>
	);
}

export function SongPage() {
	const id = Number(useParams().id);
	const { data: song, isPending, error, refetch } = useSong(id);
	usePageTitle(song?.name);

	if (isPending) return <SongSkeleton />;
	if (error) {
		if (isNotFound(error)) return <NotFound title="Song not found" message="It may have been deleted by its owner." />;
		return <ErrorState error={error} onRetry={() => void refetch()} />;
	}

	const tags = song.tags ?? [];

	return (
		<Stack gap={0}>
			<PageHeader leading={<BackLink fallback="/my-songs" />} title={song.name} subtitle={song.artist || undefined}>
				{(song.rootNote || tags.length > 0) && (
					<Group gap={6}>
						<KeyBadge value={song.rootNote} />
						{tags.map((tag) => (
							<Badge key={tag} variant="outline" color="gray" size="md">
								{tag}
							</Badge>
						))}
					</Group>
				)}
				<SongActions song={song} />
			</PageHeader>

			<SongViewer content={song.content} writtenKey={song.rootNote} storageKey={`song:${song.id}`} />

			{song.description?.trim() && (
				<Card mt="xl" className="no-print">
					<Title order={4} mb={6}>
						Notes
					</Title>
					<Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
						{song.description}
					</Text>
				</Card>
			)}

			{song.sourceUrl && (
				<Stack mt="xl">
					<SourceLinkCard url={song.sourceUrl} name={song.name} artist={song.artist} />
				</Stack>
			)}
		</Stack>
	);
}
