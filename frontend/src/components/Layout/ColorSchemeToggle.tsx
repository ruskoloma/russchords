import { NavLink, useMantineColorScheme } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';

/**
 * Cycles through auto -> light -> dark -> auto, persisting via the Mantine
 * color-scheme manager configured in `src/theme/index.ts`.
 *
 * Renders as a sidebar NavLink so it sits at the bottom of the nav panel
 * on desktop and inside the burger menu on mobile.
 */
export function ColorSchemeToggle() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	const next = colorScheme === 'auto' ? 'light' : colorScheme === 'light' ? 'dark' : 'auto';
	const label =
		colorScheme === 'auto'
			? 'Theme: system'
			: colorScheme === 'light'
				? 'Theme: light'
				: 'Theme: dark';

	const icon =
		colorScheme === 'light' ? (
			<IconSun size={16} stroke={1.5} />
		) : colorScheme === 'dark' ? (
			<IconMoon size={16} stroke={1.5} />
		) : (
			<IconDeviceDesktop size={16} stroke={1.5} />
		);

	return (
		<NavLink
			onClick={() => setColorScheme(next)}
			label={label}
			leftSection={icon}
			aria-label={label}
		/>
	);
}
