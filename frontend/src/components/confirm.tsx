import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import type { ReactNode } from 'react';

/** Promise-based confirmation dialog. Resolves true when confirmed. */
export function confirmAction(options: {
	title: string;
	message: ReactNode;
	confirmLabel?: string;
	danger?: boolean;
}): Promise<boolean> {
	return new Promise((resolve) => {
		modals.openConfirmModal({
			title: options.title,
			centered: true,
			children: typeof options.message === 'string' ? <Text size="sm">{options.message}</Text> : options.message,
			labels: { confirm: options.confirmLabel ?? 'Confirm', cancel: 'Cancel' },
			confirmProps: { color: options.danger ? 'red' : undefined },
			onConfirm: () => resolve(true),
			onCancel: () => resolve(false),
			onClose: () => resolve(false),
		});
	});
}
