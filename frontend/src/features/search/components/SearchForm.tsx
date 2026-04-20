import { Button, Flex, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface SearchFormProps {
	value: string;
	onChange: (next: string) => void;
	onSubmit: () => void;
}

/**
 * Search query input + submit button. Uses a real <form> so pressing Enter
 * submits, the query is exposed via `aria-label="Search input"` for
 * accessibility, and the button width collapses on narrow screens.
 */
export function SearchForm({ value, onChange, onSubmit }: SearchFormProps) {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.currentTarget.querySelector('input')?.blur();
				if (document.activeElement instanceof HTMLElement) {
					document.activeElement.blur();
				}
				onSubmit();
			}}
		>
			<Flex align="end" wrap="nowrap" gap={-1} w="100%">
				<TextInput
					label="Search holychords.pro"
					placeholder="Type your query"
					value={value}
					onChange={(e) => onChange(e.currentTarget.value)}
					aria-label="Search input"
					flex={1}
				/>
				<Button type="submit" leftSection={<IconSearch size={16} />} disabled={!value.trim()} ml={-5}>
					Search
				</Button>
			</Flex>
		</form>
	);
}
