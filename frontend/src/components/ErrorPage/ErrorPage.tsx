import { Alert, Stack, Title, Text, Box, Image } from '@mantine/core';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export const ErrorPage = () => {
	const error = useRouteError();

	return (
		<Stack align="center" justify="center" mih={'100vh'} p={'1rem'}>
			<Title>Something went wrong…</Title>
			<Box maw={'900px'}>
				<Box my={'1rem'}>
					<Image src="/error.gif" maw={500} />
				</Box>
				<Box w={'100%'}>
					{isRouteErrorResponse(error) ? (
						<>
							<Alert color="red" title={`${error.status} ${error.statusText}`} w="100%">
								<Text>{typeof error.data === 'string' ? error.data : 'An error occurred while loading the page.'}</Text>
							</Alert>
						</>
					) : (
						<>
							<Alert color="red" title="Error" w="100%">
								<Text>{error instanceof Error ? error.message : 'Unknown error'}</Text>
							</Alert>
						</>
					)}
				</Box>
			</Box>
		</Stack>
	);
};
