import { ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Back arrow that returns to where the user came from:
 *   1. an explicit `?source=` (set by list pages when linking into a song),
 *   2. otherwise the previous in-app history entry,
 *   3. otherwise `fallback` (page opened from a shared link).
 */
export function BackLink({ fallback, label = 'Back' }: { fallback: string; label?: string }) {
	const navigate = useNavigate();
	const location = useLocation();
	const [params] = useSearchParams();
	const source = params.get('source');

	const goBack = () => {
		if (source && source.startsWith('/') && !source.startsWith('//')) navigate(source);
		else if (location.key !== 'default') navigate(-1);
		else navigate(fallback);
	};

	return (
		<Tooltip label={label}>
			<ActionIcon size="lg" variant="default" onClick={goBack} aria-label={label} className="no-print">
				<IconArrowLeft size={18} />
			</ActionIcon>
		</Tooltip>
	);
}
