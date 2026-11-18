import { Group, Skeleton, Stack } from '@mantine/core';

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
	return (
		<div className="list-surface" aria-busy="true" aria-label="Loading">
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className="list-row">
					<Stack gap={6} className="list-row__main">
						<Skeleton height={14} width={`${50 + ((i * 17) % 35)}%`} radius="sm" />
						<Skeleton height={10} width={`${25 + ((i * 13) % 25)}%`} radius="sm" />
					</Stack>
					<Skeleton height={22} width={32} radius="sm" />
				</div>
			))}
		</div>
	);
}

export function SongSkeleton() {
	return (
		<Stack gap="md" aria-busy="true" aria-label="Loading">
			<Skeleton height={32} width="60%" radius="sm" />
			<Skeleton height={16} width="30%" radius="sm" />
			<Group gap="xs" mt="sm">
				<Skeleton height={36} width={120} radius="md" />
				<Skeleton height={36} width={90} radius="md" />
				<Skeleton height={36} width={90} radius="md" />
			</Group>
			<Stack gap={10} mt="md">
				{Array.from({ length: 12 }, (_, i) => (
					<Skeleton key={i} height={14} width={`${40 + ((i * 23) % 50)}%`} radius="sm" />
				))}
			</Stack>
		</Stack>
	);
}
