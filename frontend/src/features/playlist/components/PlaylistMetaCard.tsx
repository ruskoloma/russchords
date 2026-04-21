import { Button, Card, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { IconPencil, IconPin, IconPinFilled, IconPlayerPlay, IconShare } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface PlaylistMetaCardProps {
	title: string;
	description: string;
	editing: boolean;
	isOwner: boolean;
	hasSongs: boolean;
	pinned: boolean;
	isPinning: boolean;
	onTitleChange: (next: string) => void;
	onDescriptionChange: (next: string) => void;
	onEnterEdit: () => void;
	onTogglePin: () => void;
	onShare: () => void;
}

/**
 * Top card of the playlist detail page. Displays the title + description in
 * read mode, or a pair of Mantine inputs in edit mode. The action row on the
 * right holds Play / Edit / Pin buttons when the viewer is the owner.
 */
export function PlaylistMetaCard({
	title,
	description,
	editing,
	isOwner,
	hasSongs,
	pinned,
	isPinning,
	onTitleChange,
	onDescriptionChange,
	onEnterEdit,
	onTogglePin,
	onShare,
}: PlaylistMetaCardProps) {
	return (
		<Card withBorder shadow="sm" p={0}>
			{editing && isOwner ? (
				<Stack gap="sm" p="md">
					<TextInput label="Title" value={title} onChange={(e) => onTitleChange(e.currentTarget.value)} />
					<Textarea
						label="Description"
						value={description}
						onChange={(e) => onDescriptionChange(e.currentTarget.value)}
						autosize
						minRows={3}
					/>
				</Stack>
			) : (
				<Group justify="space-between" align="flex-start" p="md" wrap="wrap">
					<Stack gap={4} style={{ flex: '1 1 240px', minWidth: 0 }}>
						<Text fw={800} size="xl" truncate>
							{title}
						</Text>
						{description ? (
							<Text c="dimmed">{description}</Text>
						) : (
							<Text c="dimmed" fs="italic">
								No description
							</Text>
						)}
					</Stack>
					<Group gap={6} wrap="nowrap" className="playlist-meta-actions">
						{hasSongs && (
							<Button size="xs" leftSection={<IconPlayerPlay size={16} />} component={Link} to="play">
								Play
							</Button>
						)}
						<Button size="xs" variant="default" leftSection={<IconShare size={16} />} onClick={onShare}>
							Share
						</Button>
						{isOwner && (
							<>
								<Button size="xs" leftSection={<IconPencil size={16} />} onClick={onEnterEdit}>
									Edit
								</Button>
								<Button
									size="xs"
									variant="default"
									onClick={onTogglePin}
									loading={isPinning}
									leftSection={pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
								>
									{pinned ? 'Unpin' : 'Pin'}
								</Button>
							</>
						)}
					</Group>
				</Group>
			)}
		</Card>
	);
}
