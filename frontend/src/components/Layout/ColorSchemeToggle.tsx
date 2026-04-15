import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';

/**
 * Cycles through auto → light → dark → auto, persisting via the Mantine
 * color-scheme manager configured in `src/theme/index.ts`.
 *
 * The icon reflects the *currently active* scheme (not the next state) so a
 * user glancing at the header can immediately tell what mode the app is in.
 * An accessible label describes the *next* action for keyboard users.
 */
export function ColorSchemeToggle() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	const next = colorScheme === 'auto' ? 'light' : colorScheme === 'light' ? 'dark' : 'auto';
	const label =
		colorScheme === 'auto'
			? 'Using system color scheme — click for light mode'
			: colorScheme === 'light'
				? 'Light mode — click for dark mode'
				: 'Dark mode — click for system mode';

	const icon =
		colorScheme === 'light' ? <IconSun size={20} /> : colorScheme === 'dark' ? <IconMoon size={20} /> : <IconDeviceDesktop size={20} />;

	return (
		<Tooltip label={label} position="bottom-end" withArrow>
			<ActionIcon
				onClick={() => setColorScheme(next)}
				aria-label={label}
				size="lg"
				variant="subtle"
				color="gray"
			>
				{icon}
			</ActionIcon>
		</Tooltip>
	);
}
