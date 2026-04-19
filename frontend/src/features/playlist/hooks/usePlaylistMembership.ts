import { useMemo } from 'react';
import {
	useAddPlaylistToMy,
	useIsPlaylistOwner,
	useMyPlaylistsWithDetails,
	useRemovePlaylistFromMy,
} from './playlists';

/**
 * Encapsulates the "is this playlist in my library?" dance for non-owner
 * viewers. Returns ownership status, membership status, and the mutations
 * needed to add/remove the playlist from the signed-in user's library.
 */
export function usePlaylistMembership(playlistId: number, ownerId: string | undefined, isAuthenticated: boolean) {
	const isOwner = useIsPlaylistOwner(ownerId);
	const { playlists } = useMyPlaylistsWithDetails(isAuthenticated);

	const isInMy = useMemo(
		() => playlists.some((p) => p.playlistId === playlistId),
		[playlists, playlistId],
	);

	const myMembershipId = useMemo(
		() => playlists.find((p) => p.playlistId === playlistId)?.memberRecordId ?? null,
		[playlists, playlistId],
	);

	const { addToMy, isAdding } = useAddPlaylistToMy();
	const { removeFromMy, isRemovingFromMy } = useRemovePlaylistFromMy();

	return {
		isOwner,
		isInMy,
		myMembershipId,
		addToMy,
		removeFromMy,
		isAdding,
		isRemovingFromMy,
	};
}
