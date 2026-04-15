import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { showNotification } from '@mantine/notifications';
import { parserDomain } from '../constants/search';
import { createNavigationUrl } from '../../../lib/navigation';

/**
 * When the user clicks a HolyChords result, we round-trip through a Lambda
 * endpoint that parses the song and returns a cached song id we can navigate
 * to in-app. This hook owns the request state + navigation side-effect and
 * exposes a stable `redirectingLink` flag the view uses to render its loader.
 */
export function useHolychordsRedirect() {
	const navigate = useNavigate();
	const location = useLocation();
	const [redirectingLink, setRedirectingLink] = useState<string | null>(null);

	const redirectToSong = useCallback(
		async (originalLink: string) => {
			if (!parserDomain) {
				showNotification({ title: 'Cannot open', message: 'Parser domain is not configured', color: 'red' });
				return;
			}
			// Debounce: while a redirect is in flight, ignore further clicks so
			// a double-tap doesn't spawn parallel Lambda calls.
			if (redirectingLink) return;

			try {
				setRedirectingLink(originalLink);
				const songId = originalLink.split('/').at(-1);
				const lambdaUrl = `https://${parserDomain}/${songId}?client_mode=true`;

				const response = await fetch(lambdaUrl, { method: 'GET' });
				const data = await response.json();

				if (response.ok && data.songId) {
					navigate(createNavigationUrl(`/song/cached/${data.songId}`, location));
				} else {
					throw new Error(data.error || 'Failed to get song info');
				}
			} catch (e: unknown) {
				setRedirectingLink(null);
				const msg = e instanceof Error ? e.message : 'Unknown error';
				console.error('[useHolychordsRedirect] redirect failed:', e);
				showNotification({ title: 'Failed to open', message: msg, color: 'red' });
			}
		},
		[redirectingLink, navigate, location],
	);

	return { redirectingLink, redirectToSong };
}
