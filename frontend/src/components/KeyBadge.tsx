import { Badge } from '@mantine/core';

export function KeyBadge({ value }: { value?: string | null }) {
	if (!value) return null;
	return (
		<Badge
			variant="light"
			color="gray"
			size="lg"
			radius="sm"
			ff="monospace"
			aria-label={`Key ${value}`}
			style={{ flexShrink: 0, minWidth: 36 }}
		>
			{value}
		</Badge>
	);
}
