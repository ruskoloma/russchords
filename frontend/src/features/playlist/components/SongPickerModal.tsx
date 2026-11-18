import { useDeferredValue, useMemo, useState } from 'react';
import { Button, Checkbox, Group, Loader, Modal, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMySongs } from '../../../api/songs';
import { KeyBadge } from '../../../components/KeyBadge';
import { normalizeSearch } from '../../../lib/text';
import type { LiteSongDto } from '../../../types';

interface SongPickerModalProps {
	opened: boolean;
	onClose: () => void;
	/** Songs currently in the playlist (shown as checked). */
	selected: LiteSongDto[];
	onToggle: (song: LiteSongDto, add: boolean) => void;
}

/** Search your library and tick songs to add them to a playlist. */
export function SongPickerModal({ opened, onClose, selected, onToggle }: SongPickerModalProps) {
	const { data: songs, isPending } = useMySongs();
	const [query, setQuery] = useState('');
	const deferred = useDeferredValue(query);
	const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

	const visible = useMemo(() => {
		const q = normalizeSearch(deferred.trim());
		const list = songs ?? [];
		if (!q) return list.slice(0, 200);
		return list
			.filter((s) => {
				const hay = normalizeSearch(`${s.name} ${s.artist ?? ''} ${(s.tags ?? []).join(' ')}`);
				return q.split(/\s+/).every((p) => hay.includes(p));
			})
			.slice(0, 200);
	}, [songs, deferred]);

	return (
		<Modal opened={opened} onClose={onClose} title="Add songs" size="lg" fullScreen={false}>
			<Stack gap="sm">
				<TextInput
					placeholder="Search your songs"
					leftSection={<IconSearch size={16} />}
					value={query}
					onChange={(e) => setQuery(e.currentTarget.value)}
					data-autofocus
				/>
				{isPending ? (
					<Group justify="center" py="lg">
						<Loader size="sm" />
					</Group>
				) : (
					<ScrollArea.Autosize mah="55vh" type="auto">
						{visible.length === 0 ? (
							<Text c="dimmed" ta="center" py="lg" size="sm">
								{songs?.length ? 'No songs match your search.' : 'Your library is empty.'}
							</Text>
						) : (
							<div className="list-surface">
								{visible.map((song) => {
									const checked = selectedIds.has(song.id);
									return (
										<div
											key={song.id}
											className="list-row"
											data-clickable="true"
											data-selected={checked}
											role="checkbox"
											aria-checked={checked}
											tabIndex={0}
											onClick={() => onToggle(song, !checked)}
											onKeyDown={(e) => {
												if (e.key === ' ' || e.key === 'Enter') {
													e.preventDefault();
													onToggle(song, !checked);
												}
											}}
										>
											<Checkbox checked={checked} readOnly tabIndex={-1} aria-hidden size="md" />
											<div className="list-row__main">
												<Text fw={600} truncate>
													{song.name}
												</Text>
												{song.artist && (
													<Text size="sm" c="dimmed" truncate>
														{song.artist}
													</Text>
												)}
											</div>
											<KeyBadge value={song.rootNote} />
										</div>
									);
								})}
							</div>
						)}
					</ScrollArea.Autosize>
				)}
				<Group justify="space-between">
					<Text size="sm" c="dimmed">
						{selected.length} in playlist
					</Text>
					<Button onClick={onClose}>Done</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
