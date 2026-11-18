import { Button } from '@mantine/core';
import { IconLock, IconLogin } from '@tabler/icons-react';
import { signIn } from '../auth/actions';
import { EmptyState } from './EmptyState';

export function SignInRequired({ description }: { description?: string }) {
	return (
		<EmptyState
			icon={<IconLock size={28} />}
			title="Sign in to continue"
			description={description ?? 'This page is available after signing in. It’s free.'}
			action={
				<Button leftSection={<IconLogin size={16} />} onClick={() => void signIn()}>
					Sign in
				</Button>
			}
		/>
	);
}
