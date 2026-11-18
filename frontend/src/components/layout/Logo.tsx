import { Group, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

export function Logo({ size = 'lg' }: { size?: 'md' | 'lg' }) {
	const px = size === 'lg' ? 28 : 24;
	return (
		<Link to="/" aria-label="russchords — home" style={{ color: 'inherit', textDecoration: 'none' }}>
			<Group gap={8} wrap="nowrap">
				<img src="/favicon.svg" alt="" width={px} height={px} />
				<Text fw={800} fz={size === 'lg' ? 20 : 18} style={{ letterSpacing: '-0.02em' }}>
					russchords
				</Text>
			</Group>
		</Link>
	);
}
