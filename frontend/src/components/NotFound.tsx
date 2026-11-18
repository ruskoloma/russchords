import { Button, Image, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function NotFound({ title = 'Page not found', message }: { title?: string; message?: string }) {
	return (
		<Stack align="center" py={40} gap="md" ta="center">
			<Title order={1}>{title}</Title>
			<Image src="/404.gif" maw={360} radius="lg" alt="" />
			<Text c="dimmed" maw={420}>
				{message ?? 'The page you are looking for does not exist or has been moved.'}
			</Text>
			<Button component={Link} to="/" variant="light">
				Go home
			</Button>
		</Stack>
	);
}
