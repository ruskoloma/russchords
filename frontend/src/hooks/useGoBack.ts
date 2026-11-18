import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Goes back in history when there is an in-app entry, otherwise to `fallback`. */
export function useGoBack(fallback: string) {
	const navigate = useNavigate();
	const location = useLocation();
	return useCallback(() => {
		if (location.key !== 'default') navigate(-1);
		else navigate(fallback, { replace: true });
	}, [navigate, location.key, fallback]);
}
