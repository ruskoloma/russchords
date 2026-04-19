import { useMemo } from 'react';
import { Link, useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import { ActionIcon, Button, Group, MultiSelect, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconChecks, IconCopy, IconTrash, IconX, IconPin, IconPinFilled } from '@tabler/icons-react';
import { useAuth } from 'react-oidc-context';
import type { MyPlaylistDto } from '../../types';
import { usePlaylistEditor } from '../../features/playlist/hooks/usePlaylistEditor';
import { usePlaylistMembership } from '../../features/playlist/hooks/usePlaylistMembership';
import { PlaylistMetaCard } from '../../features/playlist/components/PlaylistMetaCard';
import { PlaylistSongList } from '../../features/playlist/components/PlaylistSongList';
import { PlaylistMemberActions } from '../../features/playlist/components/PlaylistMemberActions';

/**
 * Playlist detail page. Composes `usePlaylistEditor` (owner state + mutations)
 * and `usePlaylistMembership` (non-owner add/remove-from-my) with the
 * presentational children under `features/playlist/components/`.
 */
export const PlaylistPage: React.FC = () => {
	const initial = useLoaderData() as MyPlaylistDto;
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated } = useAuth();

	const editor = usePlaylistEditor(initial, isAuthenticated, () => navigate('/my-playlists'));
	const membership = usePlaylistMembership(initial.playlistId, initial.ownerId, isAuthenticated);
	const hasSongs = useMemo(() => editor.songs.length > 0, [editor.songs.length]);

	return (
		<Stack gap="md">
			{!editor.editing && isAuthenticated && (
				<Group>
					<Button
						component={Link}
						to="/my-playlists"
						variant="subtle"
						color="gray"
						size="sm"
						leftSection={<IconArrowLeft size={16} />}
					>
						My Playlists
					</Button>
				</Group>
			)}
			{editor.editing && membership.isOwner && (
				<Group justify="flex-end">
					<Button
						variant="subtle"
						color="red"
						leftSection={<IconTrash size={16} />}
						onClick={editor.onDeletePlaylist}
						loading={editor.isDeletingPlaylist}
					>
						Delete playlist
					</Button>
					<Button
						variant="default"
						onClick={editor.togglePin}
						loading={editor.isSetting}
						leftSection={editor.pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
					>
						{editor.pinned ? 'Unpin' : 'Pin'}
					</Button>
				</Group>
			)}

			<PlaylistMetaCard
				title={editor.title}
				description={editor.description}
				editing={editor.editing}
				isOwner={membership.isOwner}
				hasSongs={hasSongs}
				pinned={editor.pinned}
				isPinning={editor.isSetting}
				onTitleChange={editor.setTitle}
				onDescriptionChange={editor.setDescription}
				onEnterEdit={editor.onEnterEdit}
				onTogglePin={editor.togglePin}
			/>

			<Stack gap="xs">
				<Group justify="space-between" align="center">
					<Group gap="xs">
						<Text fw={700}>Songs</Text>
						<Tooltip label="Copy song list" withArrow>
							<ActionIcon variant="subtle" color="gray" size="sm" onClick={editor.copySongList}>
								<IconCopy size={16} />
							</ActionIcon>
						</Tooltip>
					</Group>
					<Group>
						{isAuthenticated && membership.isOwner && editor.editing && (
							<MultiSelect
								placeholder="Add/remove my songs..."
								data={editor.mySongOptions}
								value={editor.selectedIds}
								onChange={editor.onChangeSelected}
								searchable
								disabled={editor.isLoadingMySongs || editor.isAddingSong || editor.isRemoving}
								w={{ base: '100%', sm: 320 }}
								className="hide-multiselect-tags"
							/>
						)}
						{isAuthenticated && !membership.isOwner && (
							<PlaylistMemberActions
								isInMy={membership.isInMy}
								myMembershipId={membership.myMembershipId}
								isAdding={membership.isAdding}
								isRemovingFromMy={membership.isRemovingFromMy}
								onAdd={() => membership.addToMy(initial.playlistId)}
								onRemove={membership.removeFromMy}
							/>
						)}
					</Group>
				</Group>

				<PlaylistSongList
					songs={editor.songs}
					editing={editor.editing}
					isOwner={membership.isOwner}
					isRemoving={editor.isRemoving}
					location={location}
					onDragEnd={editor.onDragEnd}
					onRemoveSong={editor.removeSongByButton}
				/>

				{editor.editing && membership.isOwner && (
					<Group justify="flex-end" mt="md">
						<Button
							variant="default"
							color="gray"
							leftSection={<IconX size={16} />}
							onClick={editor.onCancelMeta}
							disabled={editor.isUpdating}
						>
							Cancel
						</Button>
						<Button leftSection={<IconChecks size={16} />} onClick={editor.onSaveMeta} loading={editor.isUpdating}>
							Save changes
						</Button>
					</Group>
				)}
			</Stack>
		</Stack>
	);
};
