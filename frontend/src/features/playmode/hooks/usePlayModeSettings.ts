import { useCallback } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { DEFAULT_PLAY_MODE_SETTINGS, type PlayModeSettings } from '../types';

const STORAGE_KEY = 'russchords-playmode-settings';

/**
 * Wraps `useLocalStorage` for the play mode settings with a stable setter API
 * plus individual field helpers. Exposing dedicated setters avoids callers
 * having to spread the previous value every time they want to change one key.
 */
export function usePlayModeSettings() {
	const [settings, setSettings] = useLocalStorage<PlayModeSettings>({
		key: STORAGE_KEY,
		defaultValue: DEFAULT_PLAY_MODE_SETTINGS,
	});

	const setFontSize = useCallback(
		(fontSize: number) => {
			setSettings((prev) => ({ ...prev, fontSize }));
		},
		[setSettings],
	);

	const setHideChords = useCallback(
		(hideChords: boolean) => {
			setSettings((prev) => ({ ...prev, hideChords }));
		},
		[setSettings],
	);

	const reset = useCallback(() => {
		setSettings(DEFAULT_PLAY_MODE_SETTINGS);
	}, [setSettings]);

	return {
		settings,
		setFontSize,
		setHideChords,
		reset,
	};
}
