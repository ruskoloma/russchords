import { Button } from '@mantine/core';

interface PlaylistMemberActionsProps {
	isInMy: boolean;
	myMembershipId: number | null;
	isAdding: boolean;
	isRemovingFromMy: boolean;
	onAdd: () => void;
	onRemove: (membershipId: number) => void;
}

/**
 * "Add to my" / "Remove from my" button for authenticated non-owners
 * viewing someone else's playlist. Only renders one button at a time
 * depending on the current membership state.
 */
export function PlaylistMemberActions({
	isInMy,
	myMembershipId,
	isAdding,
	isRemovingFromMy,
	onAdd,
	onRemove,
}: PlaylistMemberActionsProps) {
	if (isInMy) {
		return (
			<Button
				variant="light"
				color="red"
				onClick={() => myMembershipId != null && onRemove(myMembershipId)}
				disabled={myMembershipId == null}
				loading={isRemovingFromMy}
			>
				Remove from my
			</Button>
		);
	}

	return (
		<Button variant="filled" onClick={onAdd} loading={isAdding}>
			Add to my
		</Button>
	);
}
