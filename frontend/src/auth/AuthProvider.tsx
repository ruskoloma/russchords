import { useEffect, type ReactNode } from 'react';
import { AuthProvider as OidcProvider } from 'react-oidc-context';
import { Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userManager } from './userManager';
import { onSessionExpired, startSessionKeeper } from './session';
import { signIn } from './actions';

const SESSION_NOTICE_ID = 'session-expired';

function SessionWatcher() {
	useEffect(() => {
		startSessionKeeper();
		return onSessionExpired(() => {
			notifications.show({
				id: SESSION_NOTICE_ID,
				color: 'orange',
				title: 'Session expired',
				autoClose: false,
				message: (
					<Stack gap={8} align="flex-start">
						<Text size="sm">Sign in again to keep editing your songs.</Text>
						<Button
							size="compact-sm"
							onClick={() => {
								notifications.hide(SESSION_NOTICE_ID);
								void signIn();
							}}
						>
							Sign in
						</Button>
					</Stack>
				),
			});
		});
	}, []);
	return null;
}

const isSilentCallback = () => window.location.pathname.startsWith('/auth/silent-callback');

export function AuthProvider({ children }: { children: ReactNode }) {
	return (
		<OidcProvider
			userManager={userManager}
			// The silent-callback page runs inside an iframe and handles itself.
			skipSigninCallback={isSilentCallback()}
		>
			<SessionWatcher />
			{children}
		</OidcProvider>
	);
}
