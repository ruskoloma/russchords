export interface ParsedChordPro {
	name?: string;
	artist?: string;
	rootNote?: string | null;
	content: string;
}

const SECTION_TOKENS = {
	verseStart: new Set(['start_of_verse', 'sov', 'verse']),
	verseEnd: new Set(['end_of_verse', 'eov']),
	chorusStart: new Set(['start_of_chorus', 'soc', 'chorus', 'refrain']),
	chorusEnd: new Set(['end_of_chorus', 'eoc']),
};

function parseDirective(line: string): { name: string; value: string } | null {
	const m = line.match(/^\{\s*([^:}]+)\s*:?\s*([^}]*)\}$/i);
	if (!m) return null;
	const name = m[1].trim().toLowerCase();
	const value = (m[2] ?? '').trim();
	return { name, value };
}

function renderChordAlignedLine(inline: string): { chord: string; lyric: string } {
	// Tokenize into chord/lyric tokens, ensuring at least one lyric space between adjacent chords
	type Token = { type: 'chord' | 'lyric'; text: string };
	const tokens: Token[] = [];
	let i = 0;
	let prevWasChord = false;

	while (i < inline.length) {
		if (inline[i] === '[') {
			const end = inline.indexOf(']', i + 1);
			if (end === -1) {
				// unmatched '[' -> treat as lyric
				tokens.push({ type: 'lyric', text: inline[i] });
				prevWasChord = false;
				i += 1;
				continue;
			}
			const chordText = inline.slice(i + 1, end).trim();
			// If two chords go back-to-back with no lyric in between, ensure lyric has at least two spaces
			if (prevWasChord) {
				const last = tokens[tokens.length - 1];
				if (last && last.type === 'lyric') {
					// If it doesn't already end with two spaces, pad to two
					if (!/\s\s$/.test(last.text)) {
						last.text += /\s$/.test(last.text) ? ' ' : '  ';
					}
				} else {
					tokens.push({ type: 'lyric', text: '  ' });
				}
			}
			if (chordText.length > 0) {
				tokens.push({ type: 'chord', text: chordText });
				prevWasChord = true;
			} else {
				prevWasChord = false;
			}
			i = end + 1;
			continue;
		}
		// accumulate lyric until next '['
		let j = i;
		while (j < inline.length && inline[j] !== '[') j++;
		const lyricText = inline.slice(i, j);
		if (lyricText.length > 0) {
			tokens.push({ type: 'lyric', text: lyricText });
			prevWasChord = false;
		}
		i = j;
	}

	// Render chord line aligned to lyric length
	let lyric = '';
	let chordLine = '';
	for (const t of tokens) {
		if (t.type === 'lyric') {
			lyric += t.text;
			continue;
		}
		// chord token: ensure the start column is strictly after existing chord text
		if (chordLine.length >= lyric.length) {
			const needed = chordLine.length - lyric.length + 1; // at least 1 space between chords
			lyric += ' '.repeat(needed);
		}
		// Now pad chordLine up to lyric column and place chord text
		if (chordLine.length < lyric.length) {
			chordLine += ' '.repeat(lyric.length - chordLine.length);
		}
		chordLine += t.text;
	}

	return { chord: chordLine, lyric: lyric.replace(/\s+$/, '') };
}

export function parseChordPro(raw: string, filename?: string): ParsedChordPro {
	const sanitized = raw.replaceAll('|', ' ').replaceAll(' / ', ' ').replaceAll(' / ', ' ').replaceAll(' / ', ' ');

	const lines = sanitized.replace(/\r\n/g, '\n').split('\n');
	let name: string | undefined;
	let artist: string | undefined;
	let rootNote: string | null | undefined;

	const out: string[] = [];

	let verseCount = 0;

	for (let idx = 0; idx < lines.length; idx++) {
		const line = lines[idx];

		// Directive?
		if (/^\s*\{.*\}\s*$/.test(line)) {
			const d = parseDirective(line);
			if (!d) continue;
			const key = d.name;
			const val = d.value;

			if (key === 'title' || key === 't') name = name ?? val;
			if (key === 'subtitle' && !artist) artist = val;
			if (key === 'artist' || key === 'composer') artist = artist ?? val;
			if (key === 'key') rootNote = val || null;

			if (SECTION_TOKENS.verseStart.has(key)) {
				verseCount += 1;
				out.push(`${verseCount} Verse:`);
				continue;
			}
			if (SECTION_TOKENS.verseEnd.has(key)) {
				continue;
			}
			if (SECTION_TOKENS.chorusStart.has(key)) {
				out.push('Chorus:');
				continue;
			}
			if (SECTION_TOKENS.chorusEnd.has(key)) {
				continue;
			}
			// ignore other directives
			continue;
		}

		// Plain text line: could include inline chords like [C]Text
		if (line.trim() === '') {
			out.push('');
			continue;
		}

		// If there are brackets, create chord+lyric pair; else just lyric
		if (line.includes('[') && line.includes(']')) {
			const { chord, lyric } = renderChordAlignedLine(line);
			if (chord.trim().length > 0) out.push(chord);
			out.push(lyric);
		} else {
			out.push(line);
		}
	}

	const derivedName = (() => {
		if (name && name.trim()) return name;
		if (!filename) return undefined;
		const only = filename.replace(/^.*[\\\/]/, '');
		const base = only.replace(/\.[^.]+$/, '');
		return base || undefined;
	})();

	return {
		name: derivedName,
		artist,
		rootNote: rootNote ?? null,
		content: out.join('\n'),
	};
}
