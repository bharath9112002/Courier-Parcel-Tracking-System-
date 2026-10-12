// Round axis maximum and evenly spaced ticks: 0 / 50 / 100 / 150 / 200.
export function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw)
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
}

// 1,284 -> "1.3K" for axis ticks.
export const compact = (n) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

// Tooltip beside a point rather than over it, on whichever side has room.
export const tipBeside = (anchor, width, gap = 14) =>
  anchor > width / 2 ? { left: anchor - gap, transform: 'translateX(-100%)' } : { left: anchor + gap, transform: 'none' }

// Column with a 4px rounded top and a square base on the baseline.
export function columnPath(x, y, width, height, radius = 4) {
  const r = Math.min(radius, width / 2, height)
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`
}

// What happened to shipments that reached an outcome. Colours carry meaning
// (good / late / bad), so each also has an icon and label in the legend.
export const OUTCOMES = [
  { key: 'onTime', label: 'On time', icon: 'check', color: 'var(--outcome-good)' },
  { key: 'late', label: 'Late', icon: 'clock', color: 'var(--outcome-late)' },
  { key: 'notDelivered', label: 'Failed or returned', icon: 'x', color: 'var(--outcome-bad)' },
]
