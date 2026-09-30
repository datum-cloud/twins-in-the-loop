const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function dayOrdinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${day}th`;
  }

  const mod10 = day % 10;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
}

/** US long date, e.g. September 28th, 2026. */
function formatUsDate(date: Date): string {
  const month = months[date.getUTCMonth()];
  const day = dayOrdinal(date.getUTCDate());
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatPostDate(date: Date): string {
  return formatUsDate(date);
}

export function formatListDate(date: Date): string {
  return formatUsDate(date);
}
