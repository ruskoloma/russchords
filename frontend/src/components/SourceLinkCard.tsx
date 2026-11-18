import { Card, Group, Image, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import hcImage from '../assets/hc.png';

interface SourceLinkCardProps {
	url: string;
	name: string;
	artist?: string | null;
}

/** Link to the original song on holychords.pro. */
export function SourceLinkCard({ url, name, artist }: SourceLinkCardProps) {
	return (
		<Card
			component="a"
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="clickable-card no-print"
			padding="sm"
		>
			<Group gap="sm" wrap="nowrap">
				<Image src={hcImage} w={48} h={48} radius="md" alt="" />
				<div style={{ minWidth: 0, flex: 1 }}>
					<Text size="xs" c="dimmed" fw={600} tt="uppercase">
						Original on holychords.pro
					</Text>
					<Text fw={600} truncate>
						{name}
					</Text>
					{artist && (
						<Text size="sm" c="dimmed" truncate>
							{artist}
						</Text>
					)}
				</div>
				<IconExternalLink size={18} style={{ flexShrink: 0, opacity: 0.6 }} />
			</Group>
		</Card>
	);
}
