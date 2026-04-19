import { useEffect, useState } from 'react';
import { Group, Kbd, Modal, Stack, Text } from '@mantine/core';

interface Shortcut {
	keys: string[];
	label: string;
}

const SHORTCUTS: Shortcut[] = [
	{ keys: ['→'], label: 'Next song' },
	{ keys: ['←'], label: 'Previous song' },
	{ keys: ['?'], label: 'Show this overlay' },
	{ keys: ['Esc'], label: 'Close overlay' },
];

/**
 * Keyboard shortcut cheatsheet. Opens on `?` key press and closes on Escape
 * or outside-click. Registers its own global keydown listener so no wiring
 * is needed at the page level — just mount the component once per session.
 *
 * Ignored when the user is typing into a form field so shortcuts don't
 * steal characters from the sync/reload menu or any search input.
 */
export function KeyboardShortcutsOverlay() {
	const [opened, setOpened] = useState(false);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
				return;
			}
			if (e.key === '?') {
				e.preventDefault();
				setOpened(true);
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	return (
		<Modal opened={opened} onClose={() => setOpened(false)} title="Keyboard shortcuts" size="sm">
			<Stack gap="sm">
				{SHORTCUTS.map((s) => (
					<Group key={s.label} justify="space-between">
						<Text size="sm">{s.label}</Text>
						<Group gap={4}>
							{s.keys.map((k) => (
								<Kbd key={k}>{k}</Kbd>
							))}
						</Group>
					</Group>
				))}
			</Stack>
		</Modal>
	);
}
