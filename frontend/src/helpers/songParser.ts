export type Line =
	| { type: 'header'; content: string }
	| { type: 'chords'; tokens: ChordToken[] }
	| { type: 'text'; content: string }
	| { type: 'empty' };

export interface ChordToken {
	chord: string;
	spaces: number; // spaces after chord
	leading: number; // spaces before chord
}

export type SectionType = 'verse' | 'chorus' | 'other';

export const VERSE_ANCHORS: string[] = [
	'куплет:',
	'заспів:',
	'вірш:',
	'strofa:',
	'strophe:',
	'zwrotka:',
	'verse:',
	'verso:',
	'couplet:',
];

export const CHORUS_ANCHORS: string[] = [
	'припев:',
	'приспів:',
	'chorus:',
	'refrain:',
	'refren:',
	'coro:',
	'cor:',
	'refrão:',
	'hook:',
];

export interface Key {
	name: string;
	value: number;
	type: 'N' | 'S' | 'F'; // Natural, Sharp, Flat
}

export const ALL_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'H'];

export const ALL_ACTUAL_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'H'];

// All supported keys
export const KEYS: Key[] = [
	{ name: 'G#', value: 0, type: 'S' },
	{ name: 'Ab', value: 0, type: 'F' },
	{ name: 'A', value: 1, type: 'N' },
	{ name: 'A#', value: 2, type: 'S' },
	{ name: 'Bb', value: 2, type: 'F' },
	{ name: 'H', value: 3, type: 'N' },
	{ name: 'C', value: 4, type: 'N' },
	{ name: 'C#', value: 5, type: 'S' },
	{ name: 'Db', value: 5, type: 'F' },
	{ name: 'D', value: 6, type: 'N' },
	{ name: 'D#', value: 7, type: 'S' },
	{ name: 'Eb', value: 7, type: 'F' },
	{ name: 'E', value: 8, type: 'N' },
	{ name: 'F', value: 9, type: 'N' },
	{ name: 'F#', value: 10, type: 'S' },
	{ name: 'Gb', value: 10, type: 'F' },
	{ name: 'G', value: 11, type: 'N' },
];

// Regex for chords
export const CHORD_REGEX =
	/^[A-H][b#]?(2|5|6|7|9|11|13|\+|\+2|\+4|\+5|\+6|\+7|\+9|\+11|\+13|6\/9|7\-5|7\-9|7#5|#5|7#9|#9|7\+3|7\+5|7\+9|7b5|7b9|7sus2|7sus4|sus4|add2|add4|add6|add9|aug|dim|dim7|m\/maj7|m6|m7|m7b5|m9|m11|m13|maj|maj7|maj9|maj11|maj13|mb5|m|sus|sus2|sus4|m7add11|add11|b5|-5|4)*(\/[A-H][b#]*)*$/;

// List of anchors to detect headers
export const HEADER_ANCHORS: string[] = [
	'1|',
	'2|',
	'3|',
	'4|',
	'5|',
	'6|',
	'1:',
	'2:',
	'3:',
	'4:',
	'5:',
	'6:',
	'7:',
	'8:',
	'9:',
	'0:',
	'вступление:',
	'интро:',
	'куплет:',
	'припев:',
	'переход:',
	'реп:',
	'мост:',
	'мостик:',
	'вставка:',
	'речитатив:',
	'бридж:',
	'инструментал:',
	'проигрыш:',
	'запев:',
	'концовка:',
	'окончание:',
	'в конце:',
	'кода:',
	'тэг:',
	'рэп:',
	'стих:',
	'слово:',
	'декламация:',
	'финал:',
	'библия:',
	'intro:',
	'verse:',
	'chorus:',
	'bridge:',
	'instrumental:',
	'build:',
	'ending:',
	'link:',
	'outro:',
	'interlude:',
	'rap:',
	'spontaneous:',
	'refrain:',
	'tag:',
	'coda:',
	'vamp:',
	'channel:',
	'break:',
	'breakdown:',
	'hook:',
	'turnaround:',
	'turn:',
	'solo:',
	'вступ:',
	'інтро:',
	'приспів:',
	'інструментал:',
	'інтерлюдія:',
	'брідж:',
	'заспів:',
	'міст:',
	'програш:',
	'соло:',
	'перехід:',
	'повтор:',
	'кінець:',
	'в кінці:',
	'фінал:',
	'кінцівка:',
	'закінчення:',
	'тег:',
	'вірш:',
	'частина:',
	'декламація:',
	'біблія:',
	'strophe:',
	'interludio:',
	'прыпеў:',
	'прысьпеў:',
	'пройгрыш:',
	'couplet:',
	'pont:',
	'ponte:',
	'final:',
	'cor:',
	'strofă:',
	'refren:',
	'verso:',
	'coro:',
	'puente:',
	'refrão:',
	'parte:',
	'strofa:',
	'zwrotka:',
	'espontáneo:',
	'chords:',
];

// Removes any parenthetical segments (e.g., (2x), (repeat)) but preserves alignment
function stripParensPreserveSpaces(input: string): string {
	return input.replace(/\([^)]*\)/g, (m) => ' '.repeat(m.length));
}

// Checks if a line is a chord line (ignores parenthetical segments like (2x))
export function isChordLine(input: string): boolean {
	const cleaned = stripParensPreserveSpaces(input);
	const tokens = cleaned.trim().split(/\s+/);
	return tokens.every(
		(token) =>
			CHORD_REGEX.test(token) ||
			token.includes('|') ||
			token.includes('/') ||
			token.includes('-') ||
			token.includes('x') ||
			token === 'NC' ||
			token === '•' ||
			token === '*',
	);
}

// Checks if a line is a header
export function isHeaderLine(input: string): boolean {
	const text = input.trim().toLowerCase();

	if (text.length > 50) {
		return false;
	}

	return HEADER_ANCHORS.some((anchor) => text.includes(anchor));
}

export function getHeaderType(input: string): SectionType | null {
	const text = input.trim().toLowerCase();
	if (!isHeaderLine(input)) return null;
	if (VERSE_ANCHORS.some((a) => text.includes(a))) return 'verse';
	if (CHORUS_ANCHORS.some((a) => text.includes(a))) return 'chorus';
	return 'other';
}

// Parses chord line into tokens preserving leading spaces
export function parseChordLineWithSpaces(line: string): ChordToken[] {
	const tokens: ChordToken[] = [];
	const sanitized = stripParensPreserveSpaces(line);
	let i = 0;

	while (i < sanitized.length) {
		// Count spaces before chord
		let leadingSpaces = 0;
		while (sanitized[i] === ' ') {
			leadingSpaces++;
			i++;
		}
		if (i >= sanitized.length) break;

		// Read chord
		let chord = '';
		while (i < sanitized.length && sanitized[i] !== ' ') {
			chord += sanitized[i];
			i++;
		}

		// Count spaces after chord
		let spacesAfter = 0;
		while (i < sanitized.length && sanitized[i] === ' ') {
			spacesAfter++;
			i++;
		}

		tokens.push({
			chord,
			spaces: spacesAfter,
			leading: leadingSpaces,
		});
	}

	return tokens;
}

// Parses full text into structured lines
export function parseSongText(rawText: string): Line[] {
	const lines = rawText.replace(/[\u00A0\u2000-\u200B]/g, ' ').split(/\r?\n/);

	return lines.map((line) => {
		if (line.trim() === '') {
			return { type: 'empty' };
		}
		if (isHeaderLine(line)) {
			return {
				type: 'header',
				content: line.trim(),
			};
		}
		if (isChordLine(line)) {
			return {
				type: 'chords',
				tokens: parseChordLineWithSpaces(line),
			};
		}
		return {
			type: 'text',
			content: line,
		};
	});
}

// Finds a Key by its name (robust to chord modifiers like Eb2, Em7, Bb/D)
export function getKeyByName(name: string): Key {
	const root = getChordRoot(name);
	const normalized = root === 'B' ? 'H' : root;
	return KEYS.find((k) => k.name === normalized) as Key;
}

// Gets chord root part
export function getChordRoot(input: string): string {
	if (input.length > 1 && (input[1] === 'b' || input[1] === '#')) {
		return input.slice(0, 2);
	}
	return input.slice(0, 1);
}

// Calculates delta between keys
export function getDelta(oldIndex: number, newIndex: number): number {
	return newIndex - oldIndex;
}

// Determines the new key
export function getNewKey(oldKey: string, delta: number, targetKey: Key, preferType?: 'N' | 'S' | 'F'): Key {
	const old = getKeyByName(oldKey);
	if (!old) throw new Error(`Unknown old key: ${oldKey}, target key ${targetKey}`);

	let keyValue = old.value + delta;
	if (keyValue > 11) keyValue -= 12;
	if (keyValue < 0) keyValue += 12;

	const ENHARMONIC_VALUES = [0, 2, 5, 7, 10];
	const tryPick = (t: 'N' | 'S' | 'F') => KEYS.find((k) => k.value === keyValue && k.type === t);

	if (ENHARMONIC_VALUES.includes(keyValue)) {
		// 1) Prefer per-token accidental if provided
		if (preferType) {
			const p = tryPick(preferType);
			if (p) return p;
		}
		// 2) Then prefer target key's style
		if (targetKey.type) {
			const t = tryPick(targetKey.type);
			if (t) return t;
		}
		// 3) Fallbacks: natural -> sharp -> flat
		const natural = tryPick('N');
		if (natural) return natural;
		const anySharp = tryPick('S');
		if (anySharp) return anySharp;
		const anyFlat = tryPick('F');
		if (anyFlat) return anyFlat;
	} else {
		const unique = KEYS.find((k) => k.value === keyValue);
		if (unique) return unique;
	}
	throw new Error('Key not found');
}

function inferAccTypeFromRoot(root: string): 'N' | 'S' | 'F' {
	if (root.endsWith('#')) return 'S';
	if (root.endsWith('b')) return 'F';
	return 'N';
}

// Transposes single chord
export function transposeChord(chord: string, delta: number, targetKey: Key): string {
	// If there's no transposition, keep original spelling exactly as typed.
	if (delta === 0) return chord;

	const parts = chord.split('/');
	if (parts.length === 0) return chord;

	// Main chord
	const main = parts[0];
	const oldRootMain = getChordRoot(main);
	const mainPrefer = inferAccTypeFromRoot(oldRootMain);
	const newRootMain = getNewKey(oldRootMain, delta, targetKey, mainPrefer).name;
	const mainSuffix = main.slice(oldRootMain.length);
	const transposedMain = newRootMain + mainSuffix;

	// Slash parts (bass notes)
	const transposedSlashParts = parts.slice(1).map((p) => {
		if (!p) return p;
		const bassRoot = getChordRoot(p);
		const bassPrefer = inferAccTypeFromRoot(bassRoot);
		const newBassRoot = getNewKey(bassRoot, delta, targetKey, bassPrefer).name;
		const bassSuffix = p.slice(bassRoot.length);
		return newBassRoot + bassSuffix;
	});

	return [transposedMain, ...transposedSlashParts].join('/');
}

// Transposes chord token
export function transposeChordToken(token: ChordToken, delta: number, targetKey: Key): ChordToken {
	const newChord = transposeChord(token.chord, delta, targetKey);
	const spaceDiff = token.chord.length - newChord.length;
	return {
		chord: newChord,
		spaces: Math.max(token.spaces + spaceDiff, 1),
		leading: token.leading,
	};
}

// Renders chord line to string
export function renderChordLine(tokens: ChordToken[]): string {
	try {
		return tokens
			.map((t) => ' '.repeat(t.leading) + t.chord + ' '.repeat(t.spaces))
			.join('');
	} catch {
		return tokens.join('');
	}
}

export function getOriginalKey(parsedLines: Line[]): string | undefined {
	for (let i = 0; i < parsedLines.length; i++) {
		const line = parsedLines[i];
		if (line.type === 'chords' && line.tokens.length > 0) {
			const firstChord = line.tokens[0].chord;
			return getChordRoot(firstChord);
		}
	}
}

export function fillMissingChords(raw: string): string {
	// Normalize to \n for processing
	const normalized = raw.replace(/\r\n/g, '\n');
	const lines = normalized.split('\n');

	// --- Pass 1: build templates for first verse/chorus sections that actually contain chords
	type Template = string[];
	let verseTemplate: Template | null = null;
	let chorusTemplate: Template | null = null;

	let currentType: SectionType | null = null;
	let capturingType: SectionType | null = null;
	let pendingChord: string | null = null;
	let tempCollector: string[] = [];

	const flushCapture = () => {
		if (!capturingType) return;
		if (tempCollector.length > 0) {
			if (capturingType === 'verse' && !verseTemplate) verseTemplate = [...tempCollector];
			if (capturingType === 'chorus' && !chorusTemplate) chorusTemplate = [...tempCollector];
		}
		// reset
		tempCollector = [];
		pendingChord = null;
		capturingType = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (isHeaderLine(line)) {
			// new section begins; close previous capture if any
			flushCapture();
			currentType = getHeaderType(line);
			// start capture only if we don't yet have a template for that type
			if (currentType === 'verse' && !verseTemplate) capturingType = 'verse';
			else if (currentType === 'chorus' && !chorusTemplate) capturingType = 'chorus';
			else capturingType = null;
			pendingChord = null;
			continue;
		}

		if (!capturingType) continue;

		if (isChordLine(line)) {
			// store the exact rendered chord line preserving spaces
			const rendered = renderChordLine(parseChordLineWithSpaces(line));
			pendingChord = rendered;
			continue;
		}

		// Non-empty lyric line directly after a chord line => pair it
		if (pendingChord && line.trim() !== '') {
			tempCollector.push(pendingChord);
			pendingChord = null;
			continue;
		}
	}
	// handle end of file capture
	flushCapture();

	// Only accept templates from sections that actually had chords
	// (already enforced because pairs are added only when a chord preceded a lyric).

	// --- Pass 2: rebuild output inserting chords into later empty sections
	const out: string[] = [];
	let sectionType: SectionType | null = null;
	let sectionStartIndex: number | null = null;

	const flushSection = (endExclusive: number) => {
		if (sectionStartIndex === null) return;
		const body = lines.slice(sectionStartIndex, endExclusive);
		if (sectionType !== 'verse' && sectionType !== 'chorus') {
			out.push(...body);
			sectionStartIndex = null;
			sectionType = null;
			return;
		}
		// check if section already contains at least one chord line
		const hasChord = body.some((l) => isChordLine(l));
		if (hasChord) {
			out.push(...body);
		} else {
			const template = sectionType === 'verse' ? verseTemplate : chorusTemplate;
			if (!template || template.length === 0) {
				out.push(...body);
			} else {
				let ti = 0;
				for (const l of body) {
					if (l.trim() === '' || isChordLine(l)) {
						out.push(l);
						continue;
					}
					if (ti < template.length) {
						out.push(template[ti++]);
					}
					out.push(l);
				}
			}
		}
		sectionStartIndex = null;
		sectionType = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (isHeaderLine(line)) {
			// Before starting a new section, flush the previous one
			if (sectionStartIndex !== null) flushSection(i);
			out.push(line); // keep header as-is
			sectionType = getHeaderType(line);
			sectionStartIndex = i + 1; // section body begins after header
		} else if (sectionStartIndex === null) {
			// Outside of a recognized section
			out.push(line);
		}
	}
	// flush tail
	if (sectionStartIndex !== null) flushSection(lines.length);

	return out.join('\n');
}
