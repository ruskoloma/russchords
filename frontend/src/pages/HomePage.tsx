import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
	ActionIcon,
	Anchor,
	Button,
	Card,
	Code,
	Group,
	List,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconArrowRight,
	IconBolt,
	IconFileImport,
	IconLogin,
	IconMusic,
	IconPinFilled,
	IconPlayerPlayFilled,
	IconPlaylist,
	IconPlus,
	IconSearch,
	IconShare,
	IconTransfer,
} from '@tabler/icons-react';
import { useSession } from '../auth/useSession';
import { signIn } from '../auth/actions';
import { useMySongs } from '../api/songs';
import { useMyPlaylists } from '../api/playlists';
import { KeyBadge } from '../components/KeyBadge';
import { usePageTitle } from '../hooks/usePageTitle';
import { withSource } from '../lib/navigation';

const EXAMPLE = `Verse 1:
D            A                  Em          G
Light of the world, you stepped down into darkness
D           A         Em     G
Open my eyes, let me see

Chorus:
D          A         Em    G
Here I am to worship`;

function FormattingGuide() {
	return (
		<Stack gap="sm">
			<Text c="dimmed">Keep this structure so songs display and transpose correctly.</Text>
			<List spacing="xs" size="sm">
				<List.Item>
					<b>Section names</b> on their own line, ending with a colon: <Code>Verse:</Code>, <Code>Chorus:</Code>,{' '}
					<Code>Bridge:</Code>, <Code>Куплет 1:</Code>, <Code>Припев:</Code>
				</List.Item>
				<List.Item>
					<b>Chord lines</b> contain only chords separated by spaces: <Code>C G Am F</Code>. Extended chords work too:{' '}
					<Code>C#m7 Gsus4 Fmaj7 D/F#</Code>
				</List.Item>
				<List.Item>
					<b>Lyrics</b> go on the line right under their chords; line chords up over the syllable with spaces.
				</List.Item>
				<List.Item>
					Written verse 1 with chords and verse 2 without? <b>Fill chords</b> in the editor copies them over.
				</List.Item>
			</List>
			<Code block ff="monospace">
				{EXAMPLE}
			</Code>
		</Stack>
	);
}

function QuickSearch() {
	const navigate = useNavigate();
	const [q, setQ] = useState('');
	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		const query = q.trim();
		navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
	};
	return (
		<form onSubmit={onSubmit} role="search">
			<TextInput
				size="lg"
				radius="xl"
				placeholder="Search songs"
				aria-label="Search songs"
				value={q}
				onChange={(e) => setQ(e.currentTarget.value)}
				leftSection={<IconSearch size={20} />}
				rightSectionWidth={52}
				rightSection={
					<ActionIcon type="submit" size={38} radius="xl" variant="filled" color="brand" aria-label="Search">
						<IconArrowRight size={18} />
					</ActionIcon>
				}
			/>
		</form>
	);
}

function Dashboard() {
	const { displayName } = useSession();
	const location = useLocation();
	const songs = useMySongs();
	const playlists = useMyPlaylists();

	const featured = [...(playlists.data ?? [])]
		.sort((a, b) => {
			if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
			const at = a.createdAt ? Date.parse(a.createdAt) : a.playlistId;
			const bt = b.createdAt ? Date.parse(b.createdAt) : b.playlistId;
			return bt - at;
		})
		.slice(0, 4);
	const recentSongs = (songs.data ?? []).slice(0, 6);

	return (
		<Stack gap="xl">
			<Stack gap="md">
				<Title order={1}>Welcome back{displayName ? `, ${displayName}` : ''}</Title>
				<QuickSearch />
				<Group gap="xs">
					<Button component={Link} to="/song/create" variant="light" leftSection={<IconPlus size={16} />}>
						New song
					</Button>
					<Button component={Link} to="/song/create" variant="default" leftSection={<IconFileImport size={16} />}>
						Import ChordPro
					</Button>
				</Group>
			</Stack>

			<Stack gap="sm">
				<Group justify="space-between">
					<Title order={2}>Playlists</Title>
					<Anchor component={Link} to="/my-playlists" size="sm" fw={600}>
						All playlists
					</Anchor>
				</Group>
				{playlists.isPending ? (
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<Skeleton height={76} radius="lg" />
						<Skeleton height={76} radius="lg" />
					</SimpleGrid>
				) : featured.length === 0 ? (
					<Card>
						<Group justify="space-between">
							<Text c="dimmed">Create a set list for your next service.</Text>
							<Button component={Link} to="/my-playlists" variant="light" size="sm">
								Create playlist
							</Button>
						</Group>
					</Card>
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						{featured.map((p) => (
							<Card key={p.playlistId} padding="sm">
								<Group wrap="nowrap" gap="sm">
									<Link
										to={`/playlist/${p.playlistId}`}
										style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}
									>
										<Group gap={6} wrap="nowrap">
											{p.isPinned && (
												<IconPinFilled
													size={14}
													style={{ color: 'var(--mantine-primary-color-filled)', flexShrink: 0 }}
												/>
											)}
											<Text fw={700} truncate>
												{p.title}
											</Text>
										</Group>
										<Text size="sm" c="dimmed">
											{p.songs.length} song{p.songs.length === 1 ? '' : 's'}
										</Text>
									</Link>
									{p.songs.length > 0 && (
										<ActionIcon
											component={Link}
											to={`/playlist/${p.playlistId}/play`}
											size={44}
											radius="xl"
											variant="light"
											color="brand"
											aria-label={`Play ${p.title}`}
										>
											<IconPlayerPlayFilled size={18} />
										</ActionIcon>
									)}
								</Group>
							</Card>
						))}
					</SimpleGrid>
				)}
			</Stack>

			<Stack gap="sm">
				<Group justify="space-between">
					<Title order={2}>Recently edited</Title>
					<Anchor component={Link} to="/my-songs" size="sm" fw={600}>
						All songs
					</Anchor>
				</Group>
				{songs.isPending ? (
					<Skeleton height={180} radius="lg" />
				) : recentSongs.length === 0 ? (
					<Card>
						<Text c="dimmed">Your songs will show up here.</Text>
					</Card>
				) : (
					<div className="list-surface">
						{recentSongs.map((s) => (
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
				)}
			</Stack>

			<details className="disclosure">
				<summary>How to format a song with chords</summary>
				<div className="disclosure__body">
					<FormattingGuide />
				</div>
			</details>
		</Stack>
	);
}

const FEATURES = [
	{
		icon: IconSearch,
		title: 'Fast song search',
		text: 'Find songs from the holychords.pro library and open them instantly.',
	},
	{ icon: IconTransfer, title: 'Transpose in one tap', text: 'Change the key, get capo hints and chord diagrams.' },
	{
		icon: IconPlaylist,
		title: 'Set lists for services',
		text: 'Build playlists, share them with your band, play them on stage.',
	},
	{ icon: IconMusic, title: 'Your own songbook', text: 'Save songs to your space, edit them, import ChordPro files.' },
	{ icon: IconBolt, title: 'Works offline', text: 'Songs you opened stay available on a weak church Wi-Fi.' },
	{ icon: IconShare, title: 'Easy sharing', text: 'Send a link to a song or a whole playlist to anyone.' },
];

function Welcome() {
	return (
		<Stack gap="xl">
			<Stack gap="md" py={{ base: 'md', sm: 'xl' }}>
				<Title order={1} fz={{ base: 30, sm: 40 }} lh={1.15}>
					Welcome to russchords
				</Title>
				<Text size="lg" c="dimmed" maw={620}>
					Chords and lyrics for worship teams — search, transpose, build set lists and play them on stage.
				</Text>
				<QuickSearch />
				<Group gap="sm">
					<Button size="md" leftSection={<IconLogin size={18} />} onClick={() => void signIn()}>
						Sign in — it’s free
					</Button>
					<Button size="md" variant="default" component={Link} to="/search" leftSection={<IconSearch size={18} />}>
						Browse songs
					</Button>
				</Group>
			</Stack>

			<Stack gap="md">
				<Title order={2}>Key features</Title>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{FEATURES.map((f) => (
						<Card key={f.title}>
							<ThemeIcon variant="light" size={40} radius="md" mb="sm">
								<f.icon size={22} />
							</ThemeIcon>
							<Text fw={700}>{f.title}</Text>
							<Text size="sm" c="dimmed">
								{f.text}
							</Text>
						</Card>
					))}
				</SimpleGrid>
				<Text size="sm" c="dimmed">
					Tip: on any holychords.pro song page, replace <Code>holychords.pro</Code> with <Code>russchords.pro</Code> in
					the address bar to open it here.
				</Text>
			</Stack>

			<Card padding="lg">
				<Title order={2} mb="sm">
					How to write a song with chords
				</Title>
				<FormattingGuide />
			</Card>

			<Text size="sm" c="dimmed" ta="center">
				Feedback & ideas: <Anchor href="mailto:contact@russchords.pro">contact@russchords.pro</Anchor>
			</Text>
		</Stack>
	);
}

export function HomePage() {
	usePageTitle(null);
	const { isSignedIn } = useSession();
	return isSignedIn ? <Dashboard /> : <Welcome />;
}
