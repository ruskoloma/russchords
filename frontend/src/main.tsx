import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/nprogress/styles.css';
// App styles last so they can override library defaults.
import './index.css';

import { colorSchemeManager, theme } from './theme';
import { AuthProvider } from './auth/AuthProvider';
import { persistOptions, queryClient } from './app/queryClient';
import { router } from './app/router';
import { UpdatePrompt } from './app/UpdatePrompt';
import { registerChunkRecovery } from './registerChunkRecovery';

function loadTagManager(id: string) {
	const w = window as unknown as { dataLayer?: unknown[] };
	w.dataLayer = w.dataLayer || [];
	w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
	document.head.appendChild(script);
}

const gtmId = import.meta.env.VITE_GTM_ID;
if (gtmId) loadTagManager(gtmId);

// Earlier versions cached API responses in the service worker; drop that cache.
if ('caches' in window) void caches.delete('russchords-api-cache').catch(() => {});

registerChunkRecovery(() => {
	const location = router.state.navigation.location ?? router.state.location;
	return location.pathname + location.search + location.hash;
});

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
			<ModalsProvider>
				<Notifications position="top-center" limit={3} zIndex={1000} />
				<UpdatePrompt />
				<AuthProvider>
					<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
						<RouterProvider router={router} />
					</PersistQueryClientProvider>
				</AuthProvider>
			</ModalsProvider>
		</MantineProvider>
	</StrictMode>,
);
