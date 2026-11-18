import { Link } from 'react-router-dom';
import { ActionIcon, Button, Group, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { useStarred, useToggleStar } from '../api/starred';
import { useSession } from '../auth/useSession';
import { PageHeader } from '../components/PageHeader';
import { ListSkeleton } from '../components/ListSkeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { SignInRequired } from '../components/SignInRequired';
import { SongList } from '../features/song/components/SongList';
import { usePageTitle } from '../hooks/usePageTitle';
import type { SongDto } from '../types';

export function StarredPage() {
	usePageTitle('Starred');
	const { isSignedIn } = useSession();
	const { data: songs, isPending, error, refetch } = useStarred();
	const toggle = useToggleStar();

	const unstar = (song: SongDto) => {
		toggle.mutate({ song, starred: false });
		const id = `unstar-${song.id}`;
		notifications.show({
			id,
			autoClose: 5000,
			message: (
				<Group justify="space-between" wrap="nowrap" gap="xs">
					<Text size="sm" truncate>
						Removed “{song.name}”
					</Text>
					<Button
						size="compact-sm"
						variant="subtle"
						onClick={() => {
							notifications.hide(id);
							toggle.mutate({ song, starred: true });
						}}
					>
						Undo
					</Button>
				</Group>
			),
		});
	};

	if (!isSignedIn) return <SignInRequired description="Star songs to find them quickly here." />;

	return (
		<>
			<PageHeader title="Starred" />
			{isPending ? (
				<ListSkeleton />
			) : error ? (
				<ErrorState error={error} onRetry={() => void refetch()} />
			) : songs.length === 0 ? (
				<EmptyState
					icon={<IconStar size={28} />}
					title="Nothing starred yet"
					description="Tap the star on any song to keep it here — handy for songs you play often."
					action={
						<Button component={Link} to="/my-songs" variant="default">
							Open my songs
						</Button>
					}
				/>
			) : (
				<SongList
					songs={songs}
					stateKey="starred"
					sortOptions={[
						{ value: 'name', label: 'Name' },
						{ value: 'artist', label: 'Artist' },
					]}
					renderTrailing={(song) => (
						<Tooltip label="Remove from starred">
							<ActionIcon
								size="lg"
								aria-label={`Remove ${song.name} from starred`}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									unstar(song);
								}}
								style={{ color: 'var(--mantine-color-yellow-6)' }}
							>
								<IconStarFilled size={18} />
							</ActionIcon>
						</Tooltip>
					)}
				/>
			)}
		</>
	);
}
