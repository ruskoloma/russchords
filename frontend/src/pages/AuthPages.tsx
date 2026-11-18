import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { Button, Center, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { userManager } from '../auth/userManager';
import { sanitizeReturnTo, signIn, type SignInState } from '../auth/actions';

/** Landing page for the Cognito redirect (`/auth/callback?code=…&state=…`). */
export function AuthCallbackPage() {
	const auth = useAuth();
	const navigate = useNavigate();
	const [failed, setFailed] = useState<string | null>(null);

	useEffect(() => {
		if (auth.isLoading) return;

		if (auth.user && !auth.error) {
			const state = auth.user.state as SignInState | undefined;
			navigate(sanitizeReturnTo(state?.returnTo), { replace: true });
			return;
		}

		if (auth.error) {
			// Typically a reused/stale callback URL (back button, second tab).
			// If a valid session already exists just continue with it.
			void userManager.getUser().then(async (user) => {
				if (user && (!user.expired || user.refresh_token)) {
					await userManager.events.load(user);
					navigate('/', { replace: true });
				} else {
					console.error('[auth] sign-in callback failed', auth.error);
					setFailed(auth.error?.message ?? 'Sign-in failed');
				}
			});
			return;
		}

		// No user and no error: the callback was opened without auth params.
		navigate('/', { replace: true });
	}, [auth.isLoading, auth.user, auth.error, navigate]);

	if (failed) {
		return (
			<Stack align="center" py={60} gap="md" ta="center">
				<Title order={2}>Sign-in didn’t complete</Title>
				<Text c="dimmed" maw={420}>
					{failed}
				</Text>
				<Group>
					<Button onClick={() => void signIn('/')}>Try again</Button>
					<Button variant="light" onClick={() => navigate('/', { replace: true })}>
						Go home
					</Button>
				</Group>
			</Stack>
		);
	}

	return (
		<Center py={80}>
			<Stack align="center" gap="sm">
				<Loader />
				<Text c="dimmed">Signing you in…</Text>
			</Stack>
		</Center>
	);
}

/** Target of the legacy iframe-based silent renew. Notifies the parent window. */
export function SilentCallbackPage() {
	useEffect(() => {
		userManager.signinSilentCallback().catch((err) => {
			console.error('[auth] silent callback failed', err);
		});
	}, []);
	return null;
}
