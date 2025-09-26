import { Container, Stack, Title, Text, List, ThemeIcon, Anchor, Code, Card, Divider } from '@mantine/core';

export const HomePage = () => {
	return (
		<Container size="md" p={0}>
			<Stack gap="lg">
				<Stack gap="xs">
					<Title order={1}>Welcome 👋</Title>
					<Text>This app helps worship teams organize songs and chord sheets fast.</Text>
					<Text>
						For the best experience, please sign in (free). We use the{' '}
						<Anchor href="https://holychords.pro" target="_blank" rel="noopener">
							holychords.pro
						</Anchor>{' '}
						song base; you can also import <Code>ChordPro</Code> files.
					</Text>
					<Text>
						Feedback &amp; ideas: <Anchor href="mailto:contact@russchords.pro">contact@russchords.pro</Anchor>
					</Text>
				</Stack>

				<Card withBorder padding="lg" radius="md">
					<Stack gap="sm">
						<Title order={2}>Key features</Title>
						<List spacing="xs" icon={<ThemeIcon size={10} radius="xl" />}>
							<List.Item>Fast song search</List.Item>
							<List.Item>Create &amp; share playlists for services/events; save others’ playlists</List.Item>
							<List.Item>
								Save a song to your space with <Code>Fork</Code> (sign-in required)
							</List.Item>
							<List.Item>
								Import from holychords: on a song page, replace domain <Code>holychords.pro</Code> with{' '}
								<Code>russchords.pro</Code>
							</List.Item>
							<List.Item>Clone and edit songs easily</List.Item>
							<List.Item>
								Try <Code>Chord filling</Code> in the editor
							</List.Item>
						</List>
					</Stack>
				</Card>

				<Card withBorder padding="lg" radius="md">
					<Stack gap="sm">
						<Title order={2}>How to write a song with chords</Title>
						<Text c="dimmed">To display and transpose correctly, keep the structure below.</Text>

						<Title order={3} fw={600} size="h5">
							Text structure
						</Title>
						<List spacing="xs" icon={<ThemeIcon size={10} radius="xl" />}>
							<List.Item>
								<b>Section headers:</b> Put a header with a colon on its own line. Examples: <Code>Verse:</Code>,{' '}
								<Code>Chorus:</Code>, <Code>Bridge:</Code>, <Code>Outro:</Code>
							</List.Item>
							<List.Item>
								<b>Chord lines:</b> Chords in UPPERCASE, separated by spaces. Examples: <Code>C G Am F</Code>. Complex
								chords are allowed: <Code>C#m7 Gsus4 Fmaj7</Code>.
							</List.Item>
							<List.Item>
								<b>Lyric lines:</b> Write lyrics on the next line under the chords. Example:{' '}
								<Code>This is the lyrics line of the song.</Code>
							</List.Item>
						</List>

						<Divider my="xs" />

						<Title order={3} fw={600} size="h5">
							Example
						</Title>
						<Code block style={{ fontFamily: 'inherit' }}>
							{`D            A                  Em          G       D       A           G 
Light of the world, you stepped down into darkness, open my eyes, let me see
D           A         Em     G         D         A              G 
Beauty that made this heart adore you, hope of a life spent with you`}
						</Code>
					</Stack>
				</Card>
			</Stack>
		</Container>
	);
};
