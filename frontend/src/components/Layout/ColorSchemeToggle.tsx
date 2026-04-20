import { ActionIcon, Box, useMantineColorScheme } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';

/**
 * Cycles through auto -> light -> dark -> auto, persisting via the Mantine
 * color-scheme manager configured in `src/theme/index.ts`.
 *
 * Renders as a bare icon so the bottom nav stays visually quiet.
 */
export function ColorSchemeToggle() {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	const next = colorScheme === 'auto' ? 'light' : colorScheme === 'light' ? 'dark' : 'auto';
	const label = 'Toggle color scheme';

	const icon =
		colorScheme === 'light' ? (
			<IconSun size={16} stroke={1.5} />
		) : colorScheme === 'dark' ? (
			<IconMoon size={16} stroke={1.5} />
		) : (
			<IconDeviceDesktop size={16} stroke={1.5} />
		);

	return (
		<Box px={12} py={8}>
			<ActionIcon
				aria-label={label}
				variant="subtle"
				color="gray"
				size={28}
				ml={-6}
				onClick={() => setColorScheme(next)}
			>
				{icon}
			</ActionIcon>
		</Box>
	);
}
