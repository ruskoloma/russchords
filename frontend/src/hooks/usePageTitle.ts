import { useEffect } from 'react';

const APP = 'russchords';

/** Sets the browser tab title while the page is mounted. */
export function usePageTitle(title?: string | null) {
	useEffect(() => {
		document.title = title ? `${title} · ${APP}` : APP;
		return () => {
			document.title = APP;
		};
	}, [title]);
}
