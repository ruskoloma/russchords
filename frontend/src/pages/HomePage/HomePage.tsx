import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import {
	Anchor,
	Box,
	Button,
	Card,
	Code,
	Divider,
	Group,
	List,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconBook,
	IconListLetters,
	IconPin,
	IconPinFilled,
	IconPlaylist,
	IconPlaylistAdd,
	IconPlus,
	IconSearch,
	IconStar,
} from '@tabler/icons-react';
import { useMyPlaylistsWithDetails } from '../../features/playlist/hooks/playlists';
import { useAuthActions } from '../../features/auth/hooks/auth';

/**
 * Home / dashboard page. Authenticated users see a greeting, a quick-action
 * grid, and their most recent playlists. Anonymous users see the original
 * intro blurb + a clear login CTA. The "how to write a song" help card stays
 * at the bottom for everyone — it's useful reference content.
 */
export const HomePage = () => {
	const { isAuthenticated, user } = useAuth();
	const { login } = useAuthActions();
	const { playlists, isLoading: isPlaylistsLoading } = useMyPlaylistsWithDetails(isAuthenticated);

	// Pinned first, then newest. Cap at 4 to keep the hero card compact.
	const featuredPlaylists = [...playlists]
		.sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			return (b.playlistId ?? 0) - (a.playlistId ?? 0);
		})
		.slice(0, 4);

	return (
		<Stack gap="lg">
			<Stack gap="xs">
				<Title order={1}>
					{isAuthenticated
						? `Welcome back${user?.profile?.nickname ? `, ${user.profile.nickname}` : ''} 👋`
						: 'Welcome 👋'}
				</Title>
				<Text c="dimmed">
					{isAuthenticated
						? 'Pick a playlist below or jump into a quick action.'
						: 'russchords helps worship teams organize songs and chord sheets fast.'}
				</Text>
			</Stack>

			{isAuthenticated ? (
				<>
					<QuickActionsGrid />

					<Card withBorder p="lg">
						<Stack gap="sm">
							<Group justify="space-between" align="center">
								<Title order={2} size="h4">
									Your playlists
								</Title>
								<Button component={Link} to="/my-playlists" variant="subtle" size="sm">
									See all
								</Button>
							</Group>
							{isPlaylistsLoading ? (
								<Text c="dimmed" size="sm">
									Loading your playlists…
								</Text>
							) : featuredPlaylists.length === 0 ? (
								<Stack gap="xs" align="flex-start">
									<Text c="dimmed" size="sm">
										No playlists yet. Create one to start building a set.
									</Text>
									<Button component={Link} to="/my-playlists" leftSection={<IconPlaylistAdd size={16} />}>
										Create a playlist
									</Button>
								</Stack>
							) : (
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
									{featuredPlaylists.map((p) => (
										<Card
											key={p.playlistId}
											withBorder
											component={Link}
											to={`/playlist/${p.playlistId}`}
											p="md"
										>
											<Group wrap="nowrap" align="center">
												<Box style={{ flex: 1, minWidth: 0 }}>
													<Group gap="xs" wrap="nowrap">
														{p.isPinned ? <IconPinFilled size={14} /> : <IconPin size={14} />}
														<Text fw={600} truncate>
															{p.title}
														</Text>
													</Group>
													<Text c="dimmed" size="sm" truncate>
														{(p.songs?.length ?? 0)} song{(p.songs?.length ?? 0) === 1 ? '' : 's'}
													</Text>
												</Box>
											</Group>
										</Card>
									))}
								</SimpleGrid>
							)}
						</Stack>
					</Card>
				</>
			) : (
				<Card withBorder p="lg">
					<Stack gap="sm">
						<Text>
							Sign in (free) to save songs, build playlists, and use play mode during services. We use the{' '}
							<Anchor href="https://holychords.pro" target="_blank" rel="noopener">
								holychords.pro
							</Anchor>{' '}
							song base and can import <Code>ChordPro</Code> files.
						</Text>
						<Text c="dimmed" size="sm">
							Feedback & ideas:{' '}
							<Anchor href="mailto:contact@russchords.pro">contact@russchords.pro</Anchor>
						</Text>
						<Group>
							<Button onClick={() => login()} leftSection={<IconPlus size={16} />}>
								Sign in to get started
							</Button>
							<Button
								component={Link}
								to="/search"
								variant="default"
								leftSection={<IconSearch size={16} />}
							>
								Search songs
							</Button>
						</Group>
					</Stack>
				</Card>
			)}

			<Card withBorder p="lg">
				<Stack gap="sm">
					<Group gap="sm">
						<ThemeIcon variant="light" size={32}>
							<IconBook size={18} />
						</ThemeIcon>
						<Title order={2} size="h4">
							How to write a song with chords
						</Title>
					</Group>
					<Text c="dimmed" size="sm">
						Keep this structure so playback, transpose, and chord-fill work correctly.
					</Text>

					<List spacing="xs" icon={<ThemeIcon size={10} radius="xl" />}>
						<List.Item>
							<b>Section headers:</b> one per line, ending with a colon. Examples: <Code>Verse:</Code>,{' '}
							<Code>Chorus:</Code>, <Code>Bridge:</Code>, <Code>Outro:</Code>
						</List.Item>
						<List.Item>
							<b>Chord lines:</b> chords in UPPERCASE, separated by spaces. <Code>C G Am F</Code> or{' '}
							<Code>C#m7 Gsus4 Fmaj7</Code>.
						</List.Item>
						<List.Item>
							<b>Lyric lines:</b> write lyrics on the line directly under the chord line, aligned by
							spaces.
						</List.Item>
					</List>

					<Divider my="xs" />

					<Text size="sm" fw={600}>
						Example
					</Text>
					<Code block style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
						{`D            A                  Em          G       D       A           G
Light of the world, you stepped down into darkness, open my eyes, let me see
D           A         Em     G         D         A              G
Beauty that made this heart adore you, hope of a life spent with you`}
					</Code>
				</Stack>
			</Card>
		</Stack>
	);
};

/**
 * Quick-action grid for authenticated users. Five tiles linking to the
 * most-common next steps from the home page.
 */
function QuickActionsGrid() {
	const tiles = [
		{ to: '/song/create', label: 'New song', icon: <IconPlus size={20} /> },
		{ to: '/my-songs', label: 'My songs', icon: <IconListLetters size={20} /> },
		{ to: '/my-playlists', label: 'Playlists', icon: <IconPlaylist size={20} /> },
		{ to: '/starred', label: 'Starred', icon: <IconStar size={20} /> },
		{ to: '/search', label: 'Search', icon: <IconSearch size={20} /> },
	];
	return (
		<SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="sm">
			{tiles.map((t) => (
				<Card
					key={t.to}
					withBorder
					component={Link}
					to={t.to}
					p="md"
					style={{ textAlign: 'center', textDecoration: 'none' }}
				>
					<Stack gap={6} align="center">
						<ThemeIcon variant="light" size={40} radius="md">
							{t.icon}
						</ThemeIcon>
						<Text fw={600} size="sm">
							{t.label}
						</Text>
					</Stack>
				</Card>
			))}
		</SimpleGrid>
	);
}
