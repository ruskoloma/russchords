import { ActionIcon, Badge, Button, Card, Menu, Modal, Notification, Paper } from '@mantine/core';

/**
 * Component defaults. Only components that are already part of the app
 * shell are extended here — extending e.g. Select or TagsInput would pull
 * them into the initial bundle. Inputs get their radius from `defaultRadius`.
 */
export const components = {
	Button: Button.extend({ defaultProps: { radius: 'md' } }),
	ActionIcon: ActionIcon.extend({ defaultProps: { variant: 'subtle', color: 'gray', radius: 'md' } }),
	Badge: Badge.extend({ defaultProps: { radius: 'sm', tt: 'none' } }),
	Card: Card.extend({ defaultProps: { radius: 'lg', withBorder: true, padding: 'md' } }),
	Paper: Paper.extend({ defaultProps: { radius: 'lg' } }),
	Modal: Modal.extend({
		defaultProps: { radius: 'lg', overlayProps: { backgroundOpacity: 0.45, blur: 2 } },
	}),
	Menu: Menu.extend({ defaultProps: { radius: 'md', shadow: 'md' } }),
	Notification: Notification.extend({ defaultProps: { radius: 'md' } }),
};
