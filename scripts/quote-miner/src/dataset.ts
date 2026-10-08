/** Reading, checking, and searching quoting_clock's pipe-delimited litclock.csv. */

export interface Row {
  time: string;
  phrase: string;
  quote: string;
  title: string;
  author: string;
  rating: string;
}

export function parseRows(text: string): Row[] {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [time = '', phrase = '', quote = '', title = '', author = '', rating = ''] = line.split('|');
      return { time, phrase, quote, title, author, rating };
    });
}

export const formatRow = (r: Row) => [r.time, r.phrase, r.quote, r.title, r.author, r.rating].join('|');

/** The rules from quoting_clock's README, "Quote data" section. */
export function rowProblems(r: Row): string[] {
  const problems: string[] = [];
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(r.time)) problems.push(`bad time "${r.time}"`);
  if (!r.phrase) problems.push('empty time phrase');
  else if (!r.quote.toLowerCase().includes(r.phrase.toLowerCase())) problems.push(`time phrase "${r.phrase}" is not in the quote`);
  if (/<br\s*>|<br\s+\/>/i.test(r.quote)) problems.push('line break not written as <br/>');
  if (Object.values(r).some((field) => /[|\n\r]/.test(field))) problems.push('a field contains | or a line break');
  if (!r.title || !r.author) problems.push('missing title or author');
  if (r.rating !== 'sfw' && r.rating !== 'nsfw') problems.push(`bad rating "${r.rating}"`);
  return problems;
}

export interface Slot {
  total: number;
  sfw: number;
}

export function slotCounts(rows: Row[]): Map<string, Slot> {
  const slots = new Map<string, Slot>();
  for (const r of rows) {
    const slot = slots.get(r.time) ?? { total: 0, sfw: 0 };
    slot.total++;
    if (r.rating === 'sfw') slot.sfw++;
    slots.set(r.time, slot);
  }
  return slots;
}

/** Letters only, without accents: "G. K. Chesterton" and "G.K. Chesterton" compare equal. */
export const nameKey = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z]/g, '');

function words(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/<br\/>/g, ' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const SHINGLE = 5;

function shinglesOf(text: string): string[] {
  const w = words(text);
  const out: string[] = [];
  for (let i = 0; i + SHINGLE <= w.length; i++) out.push(w.slice(i, i + SHINGLE).join(' '));
  return out;
}

/**
 * Returns a lookup that finds the existing row a quote overlaps with, if any,
 * so passages already in the dataset (even trimmed differently) are skipped.
 */
export function duplicateFinder(rows: Row[]): (quote: string) => Row | undefined {
  const index = new Map<string, Set<number>>();
  rows.forEach((row, i) => {
    for (const s of shinglesOf(row.quote)) {
      const hits = index.get(s) ?? new Set<number>();
      hits.add(i);
      index.set(s, hits);
    }
  });
  return (quote) => {
    const own = [...new Set(shinglesOf(quote))];
    const counts = new Map<number, number>();
    for (const s of own) for (const i of index.get(s) ?? []) counts.set(i, (counts.get(i) ?? 0) + 1);
    let best: [number, number] | undefined;
    for (const [i, n] of counts) if (!best || n > best[1]) best = [i, n];
    if (best && best[1] >= 2 && (best[1] >= 4 || best[1] >= own.length * 0.4)) return rows[best[0]];
    return undefined;
  };
}
