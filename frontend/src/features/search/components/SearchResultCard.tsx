import { memo } from 'react';
import { Anchor, Card, Group, Loader, Stack, Text } from '@mantine/core';
import type { SearchItem } from '../hooks/search';

interface SearchResultCardProps {
	item: SearchItem;
	isRedirecting: boolean;
	isBusy: boolean;
	onOpen: (link: string) => void;
}

/**
 * A single result in the HolyChords search list. Memoized so typing in the
 * search box or paging doesn't force every card to re-render.
 *
 * The title acts as the primary click target — clicking it triggers the
 * Lambda round-trip via `onOpen`. The external link stays available as a
 * secondary affordance but is disabled while a redirect is in flight.
 */
export const SearchResultCard = memo(function SearchResultCard({
	item,
	isRedirecting,
	isBusy,
	onOpen,
}: SearchResultCardProps) {
	return (
		<Card withBorder>
			<Stack gap={4}>
				<Group gap={6} align="center" wrap="nowrap">
					<Text
						fw={600}
						c="brand"
						onClick={() => onOpen(item.link)}
						style={{
							cursor: isBusy ? 'progress' : 'pointer',
							opacity: isRedirecting ? 0.6 : 1,
						}}
						role="button"
						tabIndex={0}
						aria-busy={isRedirecting}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') onOpen(item.link);
						}}
					>
						{item.title}
					</Text>
					{isRedirecting && <Loader size="xs" />}
				</Group>
				<Anchor
					href={item.link}
					target="_blank"
					rel="noopener noreferrer"
					data-disabled={isBusy}
					style={{ pointerEvents: isBusy ? 'none' : 'auto' }}
				>
					<Text size="sm" c="dimmed">
						{item.link}
					</Text>
				</Anchor>
				<Text>{item.snippet}</Text>
			</Stack>
		</Card>
	);
});
