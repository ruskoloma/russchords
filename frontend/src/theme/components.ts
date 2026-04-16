import { ActionIcon, Button, Card, Modal, Paper, Select, TextInput, Textarea } from '@mantine/core';

/**
 * Component defaults for the "printed hymnal" theme direction.
 *
 * All radius defaults are `sm` (4px) instead of the previous `md` (6px)
 * so Buttons, Cards, Inputs, etc. feel sharper and more tactile. Cards
 * drop their shadow entirely and rely only on a 1px border so the page
 * reads flat, like printed paper.
 */
export const components = {
	Button: Button.extend({
		defaultProps: {
			radius: 'sm',
		},
	}),
	ActionIcon: ActionIcon.extend({
		defaultProps: {
			variant: 'subtle',
			radius: 'sm',
		},
	}),
	Card: Card.extend({
		defaultProps: {
			radius: 'sm',
			shadow: undefined,
			withBorder: true,
			padding: 'lg',
		},
	}),
	Paper: Paper.extend({
		defaultProps: {
			radius: 'sm',
		},
	}),
	Modal: Modal.extend({
		defaultProps: {
			radius: 'md',
			centered: true,
			overlayProps: { blur: 0 },
		},
	}),
	TextInput: TextInput.extend({
		defaultProps: {
			radius: 'sm',
		},
	}),
	Textarea: Textarea.extend({
		defaultProps: {
			radius: 'sm',
		},
	}),
	Select: Select.extend({
		defaultProps: {
			radius: 'sm',
		},
	}),
};
