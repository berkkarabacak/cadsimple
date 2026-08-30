const PALETTE = [
  '#7dd3fc', // sky
  '#a78bfa', // violet
  '#f0abfc', // fuchsia
  '#fda4af', // rose
  '#86efac', // green
  '#fde68a', // amber
  '#5eead4', // teal
  '#93c5fd', // blue
  '#c4b5fd', // purple
  '#fdba74', // orange
]

export function partColor(index: number): string {
  return PALETTE[index % PALETTE.length]
}
