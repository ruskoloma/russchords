import { Box, Button, Image, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export const NotFound = () => {
	return (
		<Stack align="center" py={40}>
			<Title>404 - Page Not Found</Title>
			<Box maw={500} my={'1rem'}>
				<Image src="/404.gif" />
			</Box>
			<Text size="lg" c="dimmed">
				The page you are looking for does not exist or has been moved.
			</Text>
			<Button my={'1rem'} component={Link} to="/" variant="outline" size="md">
				Go Home
			</Button>
		</Stack>
	);
};
