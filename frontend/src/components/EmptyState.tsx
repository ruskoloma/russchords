import type { ReactNode } from 'react';
import { Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface EmptyStateProps {
	icon?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
	return (
		<Stack align="center" gap="sm" py={48} px="md" ta="center">
			{icon && (
				<ThemeIcon size={56} radius="xl" variant="light">
					{icon}
				</ThemeIcon>
			)}
			<Title order={3}>{title}</Title>
			{description && (
				<Text c="dimmed" maw={420}>
					{description}
				</Text>
			)}
			{action}
		</Stack>
	);
}
