import { Button } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { EmptyState } from './EmptyState';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
	const message = error instanceof Error ? error.message : 'Something went wrong';
	return (
		<EmptyState
			icon={<IconAlertTriangle size={28} />}
			title="Couldn't load this"
			description={message}
			action={
				onRetry && (
					<Button variant="light" leftSection={<IconRefresh size={16} />} onClick={onRetry}>
						Try again
					</Button>
				)
			}
		/>
	);
}
