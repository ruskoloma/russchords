import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ActionIcon, Alert, Badge, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconDeviceFloppy, IconLogin, IconShare } from '@tabler/icons-react';
import { useCachedSong } from '../api/holychords';
import { useForkCachedSong, useMyForks } from '../api/songs';
import { isNotFound } from '../api/client';
import { useSession } from '../auth/useSession';
import { signIn } from '../auth/actions';
import { BackLink } from '../components/BackLink';
import { PageHeader } from '../components/PageHeader';
import { SongSkeleton } from '../components/ListSkeleton';
import { ErrorState } from '../components/ErrorState';
import { NotFound } from '../components/NotFound';
import { KeyBadge } from '../components/KeyBadge';
import { SourceLinkCard } from '../components/SourceLinkCard';
import { SongViewer } from '../features/song/components/SongViewer';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifySuccess, shareLink } from '../lib/notify';
import { withSource } from '../lib/navigation';

/** A song imported from holychords.pro (read-only until saved to "My songs"). */
export function CachedSongPage() {
	const id = useParams().id ?? '';
	const navigate = useNavigate();
	const location = useLocation();
	const { isSignedIn } = useSession();
	const { data: song, isPending, error, refetch } = useCachedSong(id);
	const forks = useMyForks(Number(id));
	const fork = useForkCachedSong();
	usePageTitle(song?.name);

	if (isPending) return <SongSkeleton />;
	if (error) {
		if (isNotFound(error)) return <NotFound title="Song not found" message="Try searching for it again." />;
		return <ErrorState error={error} onRetry={() => void refetch()} />;
	}

	const myCopies = forks.data ?? [];

	const onSave = async () => {
		const created = await fork.mutateAsync(song.id);
		notifySuccess('Saved to your songs — you can edit it now');
		navigate(`/song/${created.id}`);
	};

	return (
		<Stack gap={0}>
			<PageHeader leading={<BackLink fallback="/search" />} title={song.name} subtitle={song.artist || undefined}>
				<Group gap={6}>
					<Badge variant="light" color="gray">
						holychords.pro
					</Badge>
				</Group>
				<Group gap="xs" className="no-print">
					{isSignedIn ? (
						<Button leftSection={<IconDeviceFloppy size={18} />} onClick={() => void onSave()} loading={fork.isPending}>
							{myCopies.length > 0 ? 'Save another copy' : 'Save to my songs'}
						</Button>
					) : (
						<Button leftSection={<IconLogin size={18} />} onClick={() => void signIn()}>
							Sign in to save
						</Button>
					)}
					<Tooltip label="Share link">
						<ActionIcon size="lg" variant="default" onClick={() => void shareLink(song.name)} aria-label="Share link">
							<IconShare size={18} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</PageHeader>

			{myCopies.length > 0 && (
				<Alert variant="light" color="brand" mb="md" title="You already saved this song" className="no-print">
					<Stack gap={6}>
						{myCopies.map((copy) => (
							<Group key={copy.id} gap="xs" wrap="nowrap">
								<Text
									component={Link}
									to={withSource(`/song/${copy.id}`, location)}
									fw={600}
									size="sm"
									td="underline"
									truncate
								>
									{copy.name}
								</Text>
								<KeyBadge value={copy.rootNote} />
							</Group>
						))}
					</Stack>
				</Alert>
			)}

			<SongViewer content={song.content} storageKey={`cached:${song.id}`} />

			{song.originalUrl && (
				<Stack mt="xl">
					<SourceLinkCard url={song.originalUrl} name={song.name} artist={song.artist} />
				</Stack>
			)}
		</Stack>
	);
}
