import { ActionIcon, Button, Card, Modal, Paper, Select, TextInput, Textarea } from '@mantine/core';

/**
 * Centralised component defaults for russchords.
 *
 * Each entry uses Mantine v7+ `defaultProps` so every callsite of the given
 * component inherits the brand's look without having to pass props manually.
 * Override locally when a specific screen needs a different treatment.
 */
export const components = {
	Button: Button.extend({
		defaultProps: {
			radius: 'md',
		},
	}),
	ActionIcon: ActionIcon.extend({
		defaultProps: {
			variant: 'subtle',
			radius: 'md',
		},
	}),
	Card: Card.extend({
		defaultProps: {
			radius: 'md',
			shadow: 'sm',
			withBorder: true,
			padding: 'lg',
		},
	}),
	Paper: Paper.extend({
		defaultProps: {
			radius: 'md',
		},
	}),
	Modal: Modal.extend({
		defaultProps: {
			radius: 'lg',
			centered: true,
			overlayProps: { blur: 2 },
		},
	}),
	TextInput: TextInput.extend({
		defaultProps: {
			radius: 'md',
		},
	}),
	Textarea: Textarea.extend({
		defaultProps: {
			radius: 'md',
		},
	}),
	Select: Select.extend({
		defaultProps: {
			radius: 'md',
		},
	}),
};
