export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function calculateDue(total: number, advance: number): number {
  const safeTotal = Number.isFinite(total) ? Math.max(total, 0) : 0;
  const safeAdvance = Number.isFinite(advance) ? Math.max(advance, 0) : 0;
  return Math.max(safeTotal - safeAdvance, 0);
}
