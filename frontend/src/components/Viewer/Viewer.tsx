import { useState } from 'react';
import {
	parseSongText,
	getKeyByName,
	getDelta,
	transposeChordToken,
	renderChordLine,
	getOriginalKey,
	ALL_KEYS,
	KEYS,
	ALL_ACTUAL_KEYS,
} from '../../helpers/songParser';

interface ViewerProps {
	musicText: string;
	defaultKey?: string;
}

export const Viewer: React.FC<ViewerProps> = ({ musicText, defaultKey }) => {
	const [hideChords, setHideChords] = useState(false);

	const parsed = parseSongText(musicText);
	const originalKey = getOriginalKey(parsed);
	const [key, setKey] = useState(defaultKey || originalKey || 'C');
	const toKey = getKeyByName(key)!;

	const delta = originalKey ? getDelta(getKeyByName(originalKey).value, getKeyByName(key).value) : 0;

	const handleChangeHideChords = () => {
		setHideChords((prev) => !prev);
	};

	const handleChangeKey: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
		setKey(event.target.value);
	};

	const handleKeyDown = () => {
		const currentKey = getKeyByName(key);
		const newKey = KEYS.reverse().find((k) => k.value == currentKey.value - 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS.at(-1)!.name);
	};

	const handleKeyUp = () => {
		const currentKey = getKeyByName(key);
		const newKey = KEYS.find((k) => k.value == currentKey.value + 1 && ALL_ACTUAL_KEYS.includes(k.name));
		return newKey ? setKey(newKey.name) : setKey(KEYS[0].name!);
	};

	return (
		<div>
			<select value={key} onChange={handleChangeKey}>
				{ALL_KEYS.map((k) => (
					<option key={k}>{k}</option>
				))}
			</select>

			<button onClick={handleKeyUp}>Up</button>

			<button onClick={handleKeyDown}>Down</button>

			<button onClick={handleChangeHideChords}>{hideChords ? 'Unhide' : 'Hide'}</button>

			<pre style={{ fontFamily: 'SFMono-Regular' }}>
				{parsed.map((line, i) => {
					if (line.type === 'chords') {
						if (hideChords) {
							return <></>;
						}

						return <div key={i}>{renderChordLine(line.tokens.map((t) => transposeChordToken(t, delta, toKey)))}</div>;
					} else if (line.type === 'empty') {
						return <div>&nbsp;</div>;
					} else if (line.type === 'header') {
						return (
							<div key={i} style={{ marginTop: '1em', fontWeight: 'bold' }}>
								{line.content}
							</div>
						);
					} else {
						return <div key={i}>{line.content}</div>;
					}
				})}
			</pre>
		</div>
	);
};
