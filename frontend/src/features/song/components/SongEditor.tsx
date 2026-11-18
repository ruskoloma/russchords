import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Card,
	FileButton,
	Grid,
	Group,
	SegmentedControl,
	Select,
	SimpleGrid,
	Stack,
	TagsInput,
	Text,
	TextInput,
	Textarea,
	Tooltip,
} from '@mantine/core';
import { useHotkeys, useMediaQuery } from '@mantine/hooks';
import { IconChevronDown, IconChevronUp, IconDeviceFloppy, IconFileImport, IconWand } from '@tabler/icons-react';
import { ALL_KEYS, fillMissingChords, getOriginalKey, normalizeKeyName, parseSongText } from '../helpers/songParser';
import { deltaBetweenKeys, nextKeyDown, nextKeyUp, transposeWholeText } from '../helpers/transposeText';
import { parseChordPro } from '../helpers/chordPro';
import { SongSheet } from './SongSheet';
import { readJSON, removeKey, writeJSON } from '../../../lib/storage';
import { notifyError, notifySuccess } from '../../../lib/notify';
import { useUnsavedChangesGuard } from '../../../hooks/useUnsavedChangesGuard';

export interface SongFormValues {
	name: string;
	artist: string;
	content: string;
	rootNote: string | null;
	notes: string;
	tags: string[];
}

interface Draft {
	values: SongFormValues;
	savedAt: number;
}

interface SongEditorProps {
	initial: SongFormValues;
	/** localStorage key for the auto-saved draft. */
	draftKey: string;
	tagSuggestions: string[];
	submitLabel: string;
	onSubmit: (values: SongFormValues) => Promise<void>;
	onCancel: () => void;
}

const sameValues = (a: SongFormValues, b: SongFormValues) =>
	a.name === b.name &&
	a.artist === b.artist &&
	a.content === b.content &&
	(a.rootNote ?? null) === (b.rootNote ?? null) &&
	a.notes === b.notes &&
	a.tags.join('\u0000') === b.tags.join('\u0000');

function sanitizeDraft(raw: unknown): Draft | null {
	const d = raw as Partial<Draft> | null;
	const v = d?.values as Partial<SongFormValues> | undefined;
	if (!d || !v || typeof d.savedAt !== 'number') return null;
	if (typeof v.name !== 'string' || typeof v.content !== 'string') return null;
	return {
		savedAt: d.savedAt,
		values: {
			name: v.name,
			artist: typeof v.artist === 'string' ? v.artist : '',
			content: v.content,
			rootNote: typeof v.rootNote === 'string' ? v.rootNote : null,
			notes: typeof v.notes === 'string' ? v.notes : '',
			tags: Array.isArray(v.tags) ? v.tags.filter((t): t is string => typeof t === 'string') : [],
		},
	};
}

const KEY_OPTIONS = ALL_KEYS.map((k) => ({ value: k, label: k }));

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Song form with a live preview, ChordPro import, transpose and chord
 * filling. Every change is auto-saved as a local draft, so a closed tab,
 * a crashed browser or an expired session never loses work.
 */
export function SongEditor({ initial, draftKey, tagSuggestions, submitLabel, onSubmit, onCancel }: SongEditorProps) {
	const [restoredDraft] = useState(() => {
		const draft = sanitizeDraft(readJSON<unknown>(draftKey, null));
		return draft && !sameValues(draft.values, initial) ? draft : null;
	});
	const [values, setValues] = useState<SongFormValues>(restoredDraft?.values ?? initial);
	const [showDraftNotice, setShowDraftNotice] = useState(Boolean(restoredDraft));
	const [saving, setSaving] = useState(false);
	const [touched, setTouched] = useState(false);
	const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
	const isWide = useMediaQuery('(min-width: 75em)', true, { getInitialValueInEffect: false });

	const dirty = !sameValues(values, initial);
	// While saving the guard is off, so the page can navigate to the saved song.
	useUnsavedChangesGuard(
		dirty && !saving,
		'Your changes are not saved yet. A draft stays on this device, so you can come back to it later.',
	);

	// Auto-save the draft (debounced).
	useEffect(() => {
		const handle = window.setTimeout(() => {
			if (dirty) writeJSON(draftKey, { values, savedAt: Date.now() } satisfies Draft);
			else removeKey(draftKey);
		}, 600);
		return () => window.clearTimeout(handle);
	}, [values, dirty, draftKey]);

	const set = <K extends keyof SongFormValues>(field: K, value: SongFormValues[K]) =>
		setValues((prev) => ({ ...prev, [field]: value }));

	// ----- transpose (rewrites the text) -----------------------------------
	const workKey = useMemo(
		() => normalizeKeyName(values.rootNote) ?? normalizeKeyName(getOriginalKey(parseSongText(values.content))) ?? 'C',
		[values.rootNote, values.content],
	);

	const transposeTo = (target: string) => {
		const delta = deltaBetweenKeys(workKey, target);
		if (delta === 0) return;
		setValues((prev) => ({
			...prev,
			content: transposeWholeText(prev.content, delta, target),
			// Keep the declared key in sync with the text once it is set.
			rootNote: prev.rootNote ? target : prev.rootNote,
		}));
	};

	const fillChords = () => {
		const next = fillMissingChords(values.content);
		if (next === values.content) {
			notifyError('Nothing to fill: every section already has chords, or no section has any.', 'No changes');
			return;
		}
		set('content', next);
		notifySuccess('Chords copied into sections that had none');
	};

	const importFile = async (file: File | null) => {
		if (!file) return;
		try {
			const parsed = parseChordPro(await file.text(), file.name);
			setValues((prev) => ({
				...prev,
				name: parsed.name || prev.name,
				artist: parsed.artist || prev.artist,
				rootNote: normalizeKeyName(parsed.rootNote) ?? prev.rootNote,
				content: parsed.content,
			}));
			notifySuccess(`Imported ${file.name}`);
		} catch {
			notifyError('This file could not be read as ChordPro.', 'Import failed');
		}
	};

	// ----- submit -----------------------------------------------------------
	const nameError = touched && !values.name.trim() ? 'Give the song a name' : null;

	const submitRef = useRef<() => void>(() => {});
	const submit = useCallback(async () => {
		setTouched(true);
		if (!values.name.trim() || saving) return;
		setSaving(true);
		try {
			await onSubmit({ ...values, name: values.name.trim(), artist: values.artist.trim(), notes: values.notes.trim() });
			removeKey(draftKey);
		} catch {
			// The error notification comes from the mutation; keep the form (and draft).
			setSaving(false);
		}
	}, [values, saving, onSubmit, draftKey]);
	submitRef.current = () => void submit();

	useHotkeys([['mod+S', () => submitRef.current()]], []);

	const discardDraft = () => {
		removeKey(draftKey);
		setValues(initial);
		setShowDraftNotice(false);
	};

	const deferredContent = useDeferredValue(values.content);
	const previewLines = useMemo(() => parseSongText(deferredContent), [deferredContent]);

	// ----- render -----------------------------------------------------------
	const preview = (
		<Card padding="md" style={{ position: isWide ? 'sticky' : undefined, top: 16 }}>
			<Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
				Preview
			</Text>
			{values.content.trim() ? (
				<SongSheet lines={previewLines} fontSize={15} fitWidth />
			) : (
				<Text c="dimmed" size="sm">
					The song will appear here as you type.
				</Text>
			)}
		</Card>
	);

	const contentEditor = (
		<Stack gap="xs">
			<Group justify="space-between" gap="xs" wrap="wrap">
				<Group gap={4} wrap="nowrap">
					<Tooltip label="Transpose text down">
						<ActionIcon
							size="lg"
							variant="default"
							onClick={() => transposeTo(nextKeyDown(workKey).name)}
							aria-label="Transpose text down"
						>
							<IconChevronDown size={18} />
						</ActionIcon>
					</Tooltip>
					<Select
						aria-label="Transpose text to key"
						data={ALL_KEYS}
						value={workKey}
						onChange={(v) => v && transposeTo(v)}
						w={72}
						rightSection={null}
						rightSectionWidth={0}
						withCheckIcon={false}
						styles={{ input: { textAlign: 'center', fontWeight: 600, paddingInline: 8 } }}
						comboboxProps={{ width: 96 }}
					/>
					<Tooltip label="Transpose text up">
						<ActionIcon
							size="lg"
							variant="default"
							onClick={() => transposeTo(nextKeyUp(workKey).name)}
							aria-label="Transpose text up"
						>
							<IconChevronUp size={18} />
						</ActionIcon>
					</Tooltip>
				</Group>
				<Group gap="xs">
					<Tooltip label="Copy chords from the first verse/chorus into later sections without chords" multiline w={240}>
						<Button variant="default" leftSection={<IconWand size={16} />} onClick={fillChords}>
							Fill chords
						</Button>
					</Tooltip>
					<FileButton onChange={(f) => void importFile(f)} accept=".pro,.cho,.chordpro,.crd,.chopro,.txt">
						{(props) => (
							<Button variant="default" leftSection={<IconFileImport size={16} />} {...props}>
								Import ChordPro
							</Button>
						)}
					</FileButton>
				</Group>
			</Group>
			<Textarea
				aria-label="Song text with chords"
				className="chord-editor"
				value={values.content}
				onChange={(e) => set('content', e.currentTarget.value)}
				autosize
				minRows={18}
				spellCheck={false}
				autoCapitalize="off"
				autoCorrect="off"
				wrap="off"
				placeholder={'Verse 1:\nD          A           Bm\nLyrics go under the chords…'}
			/>
			<Text size="xs" c="dimmed">
				Put chords on their own line above the lyrics, and section names like “Verse:” or “Chorus:” on their own line.
			</Text>
		</Stack>
	);

	return (
		<Stack gap="md" pb="md">
			{showDraftNotice && restoredDraft && (
				<Alert
					color="brand"
					variant="light"
					title="Unsaved changes restored"
					withCloseButton
					onClose={() => setShowDraftNotice(false)}
				>
					<Group justify="space-between" gap="xs">
						<Text size="sm">Draft from {timeFormat.format(restoredDraft.savedAt)}.</Text>
						<Button size="compact-sm" variant="subtle" color="red" onClick={discardDraft}>
							Discard draft
						</Button>
					</Group>
				</Alert>
			)}

			<Grid gutter="lg">
				<Grid.Col span={{ base: 12, lg: 7 }}>
					<Stack gap="md">
						<Card>
							<Stack gap="sm">
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
									<TextInput
										label="Name"
										required
										value={values.name}
										onChange={(e) => set('name', e.currentTarget.value)}
										onBlur={() => setTouched(true)}
										error={nameError}
										data-autofocus
									/>
									<TextInput
										label="Artist"
										value={values.artist}
										onChange={(e) => set('artist', e.currentTarget.value)}
									/>
									<Select
										label="Key"
										description="The key the chords are written in"
										placeholder="Detect from chords"
										data={KEY_OPTIONS}
										value={normalizeKeyName(values.rootNote)}
										onChange={(v) => set('rootNote', v)}
										clearable
										allowDeselect
										searchable
									/>
									<TagsInput
										label="Tags"
										description="Press Enter to add"
										placeholder={values.tags.length ? '' : 'e.g. fast, communion'}
										data={tagSuggestions}
										value={values.tags}
										onChange={(tags) => set('tags', tags)}
										clearable
									/>
								</SimpleGrid>
							</Stack>
						</Card>

						{!isWide && (
							<SegmentedControl
								fullWidth
								value={mobileTab}
								onChange={(v) => setMobileTab(v as 'edit' | 'preview')}
								data={[
									{ value: 'edit', label: 'Edit text' },
									{ value: 'preview', label: 'Preview' },
								]}
							/>
						)}

						{isWide || mobileTab === 'edit' ? <Card>{contentEditor}</Card> : preview}

						<Card>
							<Textarea
								label="Notes"
								description="Arrangement hints, capo, who leads… Visible to anyone you share the song with."
								value={values.notes}
								onChange={(e) => set('notes', e.currentTarget.value)}
								autosize
								minRows={3}
							/>
						</Card>
					</Stack>
				</Grid.Col>
				{isWide && <Grid.Col span={{ base: 12, lg: 5 }}>{preview}</Grid.Col>}
			</Grid>

			<Box className="sticky-bottom-bar" mx={{ base: -16, md: -32 }} px={{ base: 16, md: 32 }} py="sm">
				<Group justify="space-between" gap="xs" wrap="nowrap">
					<Text size="xs" c="dimmed" visibleFrom="sm">
						{dirty ? 'Draft saved on this device · ⌘/Ctrl+S to save' : 'No changes'}
					</Text>
					<Group gap="xs" ml="auto" wrap="nowrap">
						<Button variant="default" onClick={onCancel} disabled={saving}>
							Cancel
						</Button>
						<Button leftSection={<IconDeviceFloppy size={18} />} onClick={() => void submit()} loading={saving}>
							{submitLabel}
						</Button>
					</Group>
				</Group>
			</Box>
		</Stack>
	);
}
