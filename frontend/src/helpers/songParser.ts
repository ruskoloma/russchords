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

export interface Key {
	name: string;
	value: number;
	type: 'N' | 'S' | 'F'; // Natural, Sharp, Flat
}

export const ALL_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'H'];

export const ALL_ACTUAL_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'H'];

// All supported keys
export const KEYS: Key[] = [
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
	{ name: 'G#', value: 0, type: 'S' },
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

// Checks if a line is a chord line
export function isChordLine(input: string): boolean {
	const tokens = input.trim().split(/\s+/);
	return tokens.every(
		(token) =>
			CHORD_REGEX.test(token) ||
			token.includes('|') ||
			token.includes('/') ||
			token.includes('(') ||
			token.includes(')') ||
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

// Parses chord line into tokens preserving leading spaces
export function parseChordLineWithSpaces(line: string): ChordToken[] {
	const tokens: ChordToken[] = [];
	let i = 0;

	while (i < line.length) {
		// Count spaces before chord
		let leadingSpaces = 0;
		while (line[i] === ' ') {
			leadingSpaces++;
			i++;
		}
		if (i >= line.length) break;

		// Read chord
		let chord = '';
		while (i < line.length && line[i] !== ' ') {
			chord += line[i];
			i++;
		}

		// Count spaces after chord
		let spacesAfter = 0;
		while (i < line.length && line[i] === ' ') {
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
	const lines = rawText.split(/\r?\n/);

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

// Finds a Key by its name
export function getKeyByName(name: string) {
	if (name.endsWith('m')) {
		name = name.slice(0, -1);
	}
	return KEYS.find((k) => k.name === name) as Key;
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
export function getNewKey(oldKey: string, delta: number, targetKey: Key): Key {
	const old = getKeyByName(oldKey);
	if (!old) throw new Error(`Unknown old key: ${oldKey}, target key ${targetKey}`);

	let keyValue = old.value + delta;

	if (keyValue > 11) keyValue -= 12;
	if (keyValue < 0) keyValue += 12;

	if ([0, 2, 5, 7, 10].includes(keyValue)) {
		for (const k of KEYS) {
			if (k.value === keyValue && k.type === 'S') return k;
		}
		for (const k of KEYS) {
			if (k.value === keyValue && k.type === 'F') return k;
		}
	} else {
		for (const k of KEYS) {
			if (k.value === keyValue) return k;
		}
	}
	throw new Error('Key not found');
}

// Transposes single chord
export function transposeChord(chord: string, delta: number, targetKey: Key): string {
	const oldRoot = getChordRoot(chord);
	const newRoot = getNewKey(oldRoot, delta, targetKey).name;
	return newRoot + chord.slice(oldRoot.length);
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
	return tokens.map((t) => ' '.repeat(t.leading) + t.chord + ' '.repeat(t.spaces)).join('');
}

export function getOriginalKey(parsedLines: Line[]): string | undefined {
	for (let i = parsedLines.length - 1; i >= 0; i--) {
		const line = parsedLines[i];
		if (line.type === 'chords' && line.tokens.length > 0) {
			const lastChord = line.tokens[line.tokens.length - 1].chord;
			return getChordRoot(lastChord);
		}
	}
}
