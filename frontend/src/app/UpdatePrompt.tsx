import { useEffect } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRegisterSW } from 'virtual:pwa-register/react';

const NOTICE_ID = 'app-update';
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Service-worker update flow. A new version waits until the user chooses to
 * reload (so an open tab never loses the chunks it is using), but — unlike
 * a silent "wait for every tab to close" — the user is told about it.
 * Installed PWAs are rarely closed completely, so without this prompt they
 * would keep running an old build for weeks.
 */
export function UpdatePrompt() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(_url, registration) {
			if (!registration) return;
			const check = () => {
				if (document.visibilityState === 'visible' && navigator.onLine) void registration.update().catch(() => {});
			};
			setInterval(check, CHECK_INTERVAL_MS);
			document.addEventListener('visibilitychange', check);
		},
	});

	useEffect(() => {
		if (!needRefresh) return;
		notifications.show({
			id: NOTICE_ID,
			autoClose: false,
			withCloseButton: true,
			title: 'Update available',
			message: (
				<Stack gap={8} align="flex-start">
					<Text size="sm">A new version of russchords is ready.</Text>
					<Button size="compact-sm" onClick={() => void updateServiceWorker(true)}>
						Reload
					</Button>
				</Stack>
			),
		});
	}, [needRefresh, updateServiceWorker]);

	return null;
}
