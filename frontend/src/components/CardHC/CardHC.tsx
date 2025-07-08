import { Group, Image, Paper, Text, Stack, Box, Anchor } from '@mantine/core';
import hcimage from '../../assets/hc.png';

interface CardHCProps {
	name: string;
	artist?: string;
	url: string;
}

export const CardHC: React.FC<CardHCProps> = ({ name, artist, url }) => {
	return (
		<Anchor href={url} target="_blank">
			<Paper shadow="xs" p={'xs'} mt={'md'}>
				<Group gap="sm">
					<Box>
						<Image height={70} width={70} src={hcimage} radius="md" />
					</Box>
					<Stack maw={'calc(100% - 85px)'} gap={'xs'}>
						<Text truncate>{name}</Text>
						<Text truncate>{artist}</Text>
					</Stack>
				</Group>
			</Paper>
		</Anchor>
	);
};
