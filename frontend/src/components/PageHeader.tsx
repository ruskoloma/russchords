import type { ReactNode } from 'react';
import { Box, Group, Stack, Text, Title } from '@mantine/core';

interface PageHeaderProps {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Rendered before the title, e.g. a BackLink. */
	leading?: ReactNode;
	/** Right-aligned actions; wrap below the title on narrow screens. */
	actions?: ReactNode;
	children?: ReactNode;
}

export function PageHeader({ title, subtitle, leading, actions, children }: PageHeaderProps) {
	return (
		<Stack gap="xs" mb="lg">
			<Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
				<Group gap="sm" align="flex-start" wrap="nowrap" style={{ flex: '1 1 260px', minWidth: 0 }}>
					{leading && <Box pt={2}>{leading}</Box>}
					<Box style={{ minWidth: 0 }}>
						<Title order={1} style={{ overflowWrap: 'anywhere' }}>
							{title}
						</Title>
						{subtitle && (
							<Text c="dimmed" size="md" mt={2} style={{ overflowWrap: 'anywhere' }}>
								{subtitle}
							</Text>
						)}
					</Box>
				</Group>
				{actions && (
					<Group gap="xs" wrap="wrap" className="no-print">
						{actions}
					</Group>
				)}
			</Group>
			{children}
		</Stack>
	);
}
