import type { ChordShape } from '../helpers/chordShapes';

interface ChordDiagramProps {
	shape: ChordShape;
	width?: number;
	height?: number;
}

/**
 * Hand-rolled SVG renderer for a single guitar chord shape. Kept
 * dependency-free — svguitar is ~50KB and we only need a small subset.
 *
 * The diagram shows:
 *   - 6 vertical string lines (low E on the left, high e on the right)
 *   - 5 horizontal fret lines
 *   - Dots where fingers press
 *   - "X" above muted strings, "○" above open strings
 *   - An optional barre bar across the first fret when `barre` is set
 *   - The base fret number on the left when the diagram starts above fret 1
 */
export function ChordDiagram({ shape, width = 90, height = 110 }: ChordDiagramProps) {
	const numStrings = 6;
	const numFrets = 5;

	const padTop = 18;
	const padBottom = 4;
	const padLeft = 14;
	const padRight = 8;

	const gridWidth = width - padLeft - padRight;
	const gridHeight = height - padTop - padBottom;

	const stringStep = gridWidth / (numStrings - 1);
	const fretStep = gridHeight / numFrets;

	const baseFret = shape.baseFret ?? 1;

	const textColor = 'var(--mantine-color-text)';
	const gridColor = 'var(--mantine-color-default-border)';
	const dotColor = 'var(--mantine-color-brand-filled)';

	// Map "string index 0..5" into x coordinate in the svg grid.
	const stringX = (i: number) => padLeft + i * stringStep;
	const fretY = (fret: number) => padTop + fret * fretStep;

	// Dots: convert absolute fret number into relative position (fret - baseFret + 1).
	const relativeFret = (f: number) => f - baseFret + 1;

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Guitar chord diagram"
		>
			{/* Horizontal fret lines */}
			{Array.from({ length: numFrets + 1 }, (_, i) => (
				<line
					key={`h${i}`}
					x1={padLeft}
					y1={fretY(i)}
					x2={width - padRight}
					y2={fretY(i)}
					stroke={gridColor}
					strokeWidth={i === 0 && baseFret === 1 ? 3 : 1}
				/>
			))}

			{/* Vertical string lines */}
			{Array.from({ length: numStrings }, (_, i) => (
				<line
					key={`v${i}`}
					x1={stringX(i)}
					y1={fretY(0)}
					x2={stringX(i)}
					y2={fretY(numFrets)}
					stroke={gridColor}
					strokeWidth={1}
				/>
			))}

			{/* Base fret label if playing above fret 1 */}
			{baseFret > 1 && (
				<text
					x={padLeft - 4}
					y={fretY(0) + fretStep / 2 + 4}
					fontSize={10}
					fill={textColor}
					textAnchor="end"
				>
					{baseFret}fr
				</text>
			)}

			{/* Muted / open markers above the diagram */}
			{shape.frets.map((f, i) => {
				const cx = stringX(i);
				const cy = padTop - 8;
				if (f === -1) {
					return (
						<text key={`m${i}`} x={cx} y={cy} fontSize={11} fill={textColor} textAnchor="middle">
							×
						</text>
					);
				}
				if (f === 0) {
					return (
						<circle key={`o${i}`} cx={cx} cy={cy - 2} r={3.5} fill="none" stroke={textColor} strokeWidth={1} />
					);
				}
				return null;
			})}

			{/* Barre bar */}
			{shape.barre != null &&
				(() => {
					const rel = relativeFret(shape.barre);
					if (rel < 1 || rel > numFrets) return null;
					const y = fretY(rel - 1) + fretStep / 2;
					// Find the leftmost and rightmost strings that are fretted at the barre fret.
					const barreFrets = shape.frets
						.map((f, i) => ({ f, i }))
						.filter((e) => e.f === shape.barre);
					if (barreFrets.length === 0) return null;
					const first = barreFrets[0].i;
					const last = barreFrets[barreFrets.length - 1].i;
					return (
						<line
							x1={stringX(first)}
							y1={y}
							x2={stringX(last)}
							y2={y}
							stroke={dotColor}
							strokeWidth={fretStep * 0.55}
							strokeLinecap="round"
						/>
					);
				})()}

			{/* Finger dots */}
			{shape.frets.map((f, i) => {
				if (f <= 0) return null;
				const rel = relativeFret(f);
				if (rel < 1 || rel > numFrets) return null;
				const cx = stringX(i);
				const cy = fretY(rel - 1) + fretStep / 2;
				const finger = shape.fingers[i];
				return (
					<g key={`d${i}`}>
						<circle cx={cx} cy={cy} r={fretStep * 0.28} fill={dotColor} />
						{finger > 0 && (
							<text
								x={cx}
								y={cy + 3}
								fontSize={9}
								fill="var(--mantine-color-white)"
								textAnchor="middle"
								fontWeight="bold"
							>
								{finger}
							</text>
						)}
					</g>
				);
			})}
		</svg>
	);
}
