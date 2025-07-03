import { useState } from 'react';
import { parseSongText, getKeyByName, getDelta, transposeChordToken, renderChordLine } from '../../helpers/songParser';

const rawText = `
1 Verse:  
E                       H                               F#m               A
Light of the world - You stepped down into darkness
E                   H                    A
Opened my eyes, let me see.
E                H                   F#m            A
Beauty that made this heart adore You
E                H                            A
Hope of a life spent with You


Chorus:  
                           E
Here I am to worship
                             H/D#
Here I am to bow down
                       C#m                              A
Here I am to say that You're my God
                                   E
You're altogether lovely
                     H/D#
Altogether worthy
                    C#m                     A
Altogether wonderful to me


2 Verse:  
King of all days      Oh so highly exalted
Glorious in Heaven above
Humbly You came to the earth You created
All for love's sake became poor


Bridge:  
      H/D#   E/G#              A
I'll never know how much it cost
   H/D#     E/G#      A      
To see my sin upon that cross
`;

export function SongComponent() {
	const [key, setKey] = useState('C');

	const parsed = parseSongText(rawText);
	const fromKey = getKeyByName('E')!;
	const toKey = getKeyByName(key)!;
	const delta = getDelta(fromKey.value, toKey.value);

	return (
		<div>
			<select value={key} onChange={(e) => setKey(e.target.value)}>
				{['C', 'D', 'E', 'F', 'G', 'A', 'H'].map((k) => (
					<option key={k}>{k}</option>
				))}
			</select>

			<pre style={{ fontFamily: 'SFMono-Regular' }}>
				{parsed.map((line, i) => {
					if (line.type === 'header') {
						return (
							<div key={i} style={{ marginTop: '1em', fontWeight: 'bold' }}>
								{line.content}
							</div>
						);
					} else if (line.type === 'chords') {
						return <div key={i}>{renderChordLine(line.tokens.map((t) => transposeChordToken(t, delta, toKey)))}</div>;
					} else {
						return <div key={i}>{line.content}</div>;
					}
				})}
			</pre>
		</div>
	);
}
