import { Button, Code, Group, Image, Stack, Text, Title } from '@mantine/core';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { NotFound } from './NotFound';

export function RouteError() {
	const error = useRouteError();

	if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;

	const message = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: error instanceof Error
			? error.message
			: 'Unknown error';

	return (
		<Stack align="center" justify="center" mih="70vh" p="md" gap="md" ta="center">
			<Title order={1}>Something went wrong</Title>
			<Image src="/error.gif" maw={360} radius="lg" alt="" />
			<Code block maw={560} style={{ whiteSpace: 'pre-wrap' }}>
				{message}
			</Code>
			<Group>
				<Button onClick={() => window.location.reload()}>Reload</Button>
				<Button component={Link} to="/" variant="light">
					Go home
				</Button>
			</Group>
			<Text size="sm" c="dimmed">
				If this keeps happening, write to contact@russchords.pro
			</Text>
		</Stack>
	);
}
