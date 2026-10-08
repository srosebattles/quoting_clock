/**
 * Mines clock-time quotes from Project Gutenberg books for quoting_clock.
 * See README.md for the whole workflow.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { findApproximation, placeNear } from './approx.ts';
import { BOOKS, type Book } from './books.ts';
import { duplicateFinder, formatRow, nameKey, parseRows, rowProblems, slotCounts, type Row, type Slot } from './dataset.ts';
import { downloadBook, excerpt, isHeading, parseBook } from './text.ts';
import { findTimes, formatTime, resolveTimes, type AmPm, type Confidence, type TimeMatch } from './times.ts';

const USAGE = `Usage (from the repository root):
  npm run quotes:extract -- [--books 2701,11] [--per-slot 2]
  npm run quotes:render
  npm run quotes:merge -- [--drop 3,17] [--dry-run]`;

// Downloads and working files live in .work/, which git ignores.
const WORK_DIR = fileURLToPath(new URL('../.work', import.meta.url));
const TEXT_DIR = join(WORK_DIR, 'texts');
const OUT_DIR = join(WORK_DIR, 'out');
const CANDIDATES_FILE = join(OUT_DIR, 'candidates.json');
const CANDIDATES_MD = join(OUT_DIR, 'candidates.md');
const DECISIONS_FILE = join(OUT_DIR, 'decisions.json');
const REVIEW_FILE = join(WORK_DIR, 'quote-review.md');
const DEFAULT_DATASET = fileURLToPath(new URL('../../../src/components/Clock/litclock.csv', import.meta.url));

interface Candidate {
  id: number;
  bookId: number;
  title: string;
  author: string;
  times: string[];
  ampm: AmPm;
  phrase: string;
  quote: string;
  confidence: Confidence;
  kind: string;
  /**
   * clipped: starts or ends mid-sentence; phrase-repeats: the phrase occurs
   * more than once, so the clock bolds each; book-has-time: litclock.csv
   * already has a quote from this book at one of these times.
   */
  flags: string[];
  paragraph: number;
}

/** One entry in decisions.json, keyed by candidate id. Unlisted candidates go in as is, rated SFW. */
interface Decision {
  drop?: string;
  times?: string[];
  phrase?: string;
  quote?: string;
  rating?: 'sfw' | 'nsfw';
  note?: string;
  /** Keep `times` as given even if the phrase says "nearly" or "just after". */
  exact?: boolean;
}

interface Reviewed {
  candidate: Candidate;
  times: string[];
  phrase: string;
  quote: string;
  rating: 'sfw' | 'nsfw';
  dropped?: string;
  note?: string;
  /** Set when an approximate time ("nearly eleven") was moved off the named minute. */
  placed?: string;
  problems: string[];
}

const CONFIDENCE_SCORE: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

const readJson = async <T>(file: string): Promise<T> => JSON.parse(await readFile(file, 'utf8')) as T;
const occurrences = (haystack: string, needle: string) => haystack.toLowerCase().split(needle.toLowerCase()).length - 1;

function isSameBook(row: Row, book: Book): boolean {
  return nameKey(row.author) === nameKey(book.author) && [book.title, ...(book.aliases ?? [])].some((t) => nameKey(t) === nameKey(row.title));
}

/** The clock bolds every case-insensitive match, so prefer a phrase that occurs once. */
function choosePhrase(quote: string, match: TimeMatch): { phrase: string; repeats: boolean } {
  for (const phrase of [match.shortPhrase, match.text]) {
    if (phrase && occurrences(quote, phrase) === 1) return { phrase, repeats: false };
  }
  return { phrase: match.text, repeats: true };
}

function score(c: Candidate): number {
  return (
    CONFIDENCE_SCORE[c.confidence] * 10 -
    (c.flags.includes('clipped') ? 3 : 0) -
    (c.flags.includes('phrase-repeats') ? 2 : 0) -
    Math.abs(c.quote.length - 220) / 100
  );
}

/** Keeps the best `perSlot` candidates for each set of times in one book. */
function capPerSlot(found: Candidate[], perSlot: number): Candidate[] {
  const bySlot = new Map<string, Candidate[]>();
  for (const c of found) {
    const group = bySlot.get(c.times.join(',')) ?? [];
    if (!group.some((other) => other.quote === c.quote)) group.push(c);
    bySlot.set(c.times.join(','), group);
  }
  return [...bySlot.values()]
    .flatMap((group) => group.sort((a, b) => score(b) - score(a)).slice(0, perSlot))
    .sort((a, b) => a.times[0].localeCompare(b.times[0]) || a.paragraph - b.paragraph);
}

function candidatesMarkdown(candidates: Candidate[]): string {
  const lines = [
    '# Candidates for the review pass',
    '',
    'Each entry: `#id times [a.m./p.m.] confidence kind flags | phrase`, then the quote. See README.md for the rules.',
    '',
  ];
  let book = -1;
  for (const c of candidates) {
    if (c.bookId !== book) {
      book = c.bookId;
      lines.push(`## ${c.title} — ${c.author} (pg${c.bookId})`, '');
    }
    lines.push(`#${c.id} ${c.times.join(',')} [${c.ampm}] ${c.confidence} ${c.kind}${c.flags.map((f) => ` ${f}`).join('')} | ${c.phrase}`, c.quote, '');
  }
  return lines.join('\n');
}

async function extract(datasetPath: string, perSlot: number, only?: Set<number>): Promise<void> {
  const dataset = parseRows(await readFile(datasetPath, 'utf8'));
  const findDuplicate = duplicateFinder(dataset);
  const candidates: Candidate[] = [];

  for (const book of BOOKS.filter((b) => !only || only.has(b.id))) {
    console.log(`${book.title} (pg${book.id})`);
    const { language, paragraphs } = parseBook(await readFile(await downloadBook(book.id, TEXT_DIR), 'utf8'));
    if (language !== 'English') console.warn(`  warning: Gutenberg lists the language as ${language ?? 'unknown'}`);
    const bookTimes = new Set(dataset.filter((r) => isSameBook(r, book)).map((r) => r.time));
    let matches = 0;
    let duplicates = 0;
    const found: Candidate[] = [];

    paragraphs.forEach((paragraph, index) => {
      if (isHeading(paragraph)) return;
      for (const match of findTimes(paragraph)) {
        matches++;
        const { text: quote, clipped } = excerpt(paragraphs, index, match.start, match.end);
        if (quote.includes('|')) continue;
        if (findDuplicate(quote)) {
          duplicates++;
          continue;
        }
        const { phrase, repeats } = choosePhrase(quote, match);
        const { minutes, ampm } = resolveTimes(match, quote.replace(match.text, ' '));
        const times = minutes.map(formatTime).sort();
        const flags = [
          clipped && 'clipped',
          repeats && 'phrase-repeats',
          times.some((t) => bookTimes.has(t)) && 'book-has-time',
        ].filter((f): f is string => typeof f === 'string');
        found.push({
          id: 0, bookId: book.id, title: book.title, author: book.author, times, ampm, phrase, quote,
          confidence: match.confidence, kind: match.kind, flags, paragraph: index,
        });
      }
    });

    const kept = capPerSlot(found, perSlot);
    console.log(`  ${matches} time phrases, ${duplicates} already in the dataset, ${kept.length} kept (at most ${perSlot} per time)`);
    candidates.push(...kept);
  }

  candidates.forEach((c, i) => (c.id = i + 1));
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(CANDIDATES_FILE, JSON.stringify(candidates, null, 1));
  await writeFile(CANDIDATES_MD, candidatesMarkdown(candidates));
  if (existsSync(DECISIONS_FILE)) console.warn(`Note: ${DECISIONS_FILE} is from an earlier run and its numbers no longer match.`);
  console.log(`\n${candidates.length} candidates written to ${CANDIDATES_MD}`);
}

function applyDecisions(candidates: Candidate[], decisions: Record<string, Decision>, slots: Map<string, Slot>): Reviewed[] {
  const ids = new Set(candidates.map((c) => String(c.id)));
  const unknown = Object.keys(decisions).filter((id) => !ids.has(id));
  if (unknown.length) throw new Error(`decisions.json mentions unknown candidates: ${unknown.join(', ')}`);
  const counts = new Map([...slots].map(([time, slot]): [string, number] => [time, slot.total]));
  return candidates.map((candidate) => {
    const d = decisions[candidate.id] ?? {};
    const reviewed: Reviewed = {
      candidate,
      times: d.times ?? candidate.times,
      phrase: d.phrase ?? candidate.phrase,
      quote: d.quote ?? candidate.quote,
      rating: d.rating ?? 'sfw',
      dropped: d.drop,
      note: d.note,
      problems: [],
    };
    const approx = d.exact || d.drop ? undefined : findApproximation(reviewed.quote, reviewed.phrase);
    if (approx) {
      const named = reviewed.times;
      reviewed.phrase = approx.phrase;
      reviewed.times = named.map((t) => placeNear(t, approx, counts));
      reviewed.placed = `“${approx.phrase}”, so moved from ${named.join(' and ')}`;
    } else if (!reviewed.dropped) {
      for (const t of reviewed.times) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    reviewed.problems = reviewed.times.length ? [...new Set(rowsOf(reviewed).flatMap(rowProblems))] : ['no times'];
    return reviewed;
  });
}

const rowsOf = (r: Reviewed): Row[] =>
  r.times.map((time) => ({ time, phrase: r.phrase, quote: r.quote, title: r.candidate.title, author: r.candidate.author, rating: r.rating }));

const escapeMarkdown = (s: string) => s.replace(/([\\*_`])/g, '\\$1');
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const FLAG_NOTES: Record<string, string> = {
  clipped: 'starts or ends mid-sentence',
  'phrase-repeats': 'the time phrase appears more than once, so each gets bolded',
  'book-has-time': 'the dataset already has a quote from this book at this time',
};

function reviewEntry(r: Reviewed, slots: Map<string, Slot>): string {
  const head = `**#${r.candidate.id} · ${r.times.join(' and ')}** · ${r.rating.toUpperCase()}`;
  const quote = escapeMarkdown(r.quote)
    .replace(new RegExp(escapeRegExp(escapeMarkdown(r.phrase)), 'gi'), '**$&**')
    .split('<br/>')
    .join('\n>\n> ');
  const decidedTimes = r.times !== r.candidate.times;
  const notes = [
    `already at ${r.times.length > 1 ? 'these minutes' : 'this minute'}: ${r.times.map((t) => slots.get(t)?.total ?? 0).join(' and ')}`,
    r.times.length > 1 && 'could be a.m. or p.m., so it goes in at both',
    r.times.length === 1 && !decidedTimes && !r.placed && r.candidate.ampm === 'inferred' && 'a.m. or p.m. inferred from context',
    r.placed,
    ...r.candidate.flags.map((f) => FLAG_NOTES[f] ?? f),
    r.note,
    ...r.problems.map((p) => `⚠ ${p}`),
  ].filter((n): n is string => typeof n === 'string' && n !== '');
  return `${head}\n\n> ${quote}\n\n_${notes.join(' · ')}_\n`;
}

function reviewMarkdown(reviewed: Reviewed[], slots: Map<string, Slot>): string {
  const kept = reviewed.filter((r) => !r.dropped);
  const dropped = reviewed.filter((r) => r.dropped);
  const books = [...new Set(kept.map((r) => r.candidate.bookId))];
  const rowCount = kept.reduce((n, r) => n + r.times.length, 0);
  const out = [
    '# Gutenberg quote review',
    '',
    `${kept.length} quotes from ${books.length} books, making ${rowCount} rows. A quote that could be a.m. or p.m. goes in at both times, as the dataset already does.`,
    '',
    'Reply with the numbers to cut (for example, "cut 4, 17, 22") and any changes (for example, "#9 is NSFW" or "#12 should only be 15:00"). Everything else goes in.',
    '',
  ];
  for (const bookId of books) {
    const entries = kept.filter((r) => r.candidate.bookId === bookId);
    const { title, author } = entries[0].candidate;
    out.push(`## ${title} — ${author} (${entries.length})`, '', ...entries.map((r) => reviewEntry(r, slots)));
  }
  if (dropped.length) {
    out.push('## Cut in the first pass', '', 'Say the number if you want one back.', '');
    for (const r of dropped) {
      const short = r.quote.length > 90 ? `${r.quote.slice(0, 90)}…` : r.quote;
      out.push(`- #${r.candidate.id} · ${r.candidate.title} · ${r.times.join(' and ')}: ${r.dropped} — “${escapeMarkdown(short)}”`);
    }
  }
  return `${out.join('\n')}\n`;
}

async function loadReviewed(slots: Map<string, Slot>): Promise<Reviewed[]> {
  const candidates = await readJson<Candidate[]>(CANDIDATES_FILE);
  const decisions = existsSync(DECISIONS_FILE) ? await readJson<Record<string, Decision>>(DECISIONS_FILE) : {};
  return applyDecisions(candidates, decisions, slots);
}

async function render(datasetPath: string): Promise<void> {
  const slots = slotCounts(parseRows(await readFile(datasetPath, 'utf8')));
  const reviewed = await loadReviewed(slots);
  await writeFile(REVIEW_FILE, reviewMarkdown(reviewed, slots));
  const kept = reviewed.filter((r) => !r.dropped);
  console.log(`${kept.length} quotes in ${REVIEW_FILE}; ${reviewed.length - kept.length} cut`);
  for (const r of kept.filter((r) => r.problems.length)) console.warn(`  #${r.candidate.id}: ${r.problems.join('; ')}`);
}

async function merge(csvPath: string, drop: Set<number>, dryRun: boolean): Promise<void> {
  const original = await readFile(csvPath, 'utf8');
  const reviewed = await loadReviewed(slotCounts(parseRows(original)));
  const unknown = [...drop].filter((id) => !reviewed.some((r) => r.candidate.id === id));
  if (unknown.length) throw new Error(`--drop mentions unknown candidates: ${unknown.join(', ')}`);
  const accepted = reviewed.filter((r) => !r.dropped && !drop.has(r.candidate.id));
  const broken = accepted.filter((r) => r.problems.length);
  if (broken.length) {
    for (const r of broken) console.error(`#${r.candidate.id}: ${r.problems.join('; ')}`);
    throw new Error('Fix these in decisions.json (or drop them) before merging.');
  }

  const lines = original.split('\n').filter((line) => line.trim());
  // Match on title and quote, not time, so re-running a merge never adds a quote twice.
  const existing = new Set(parseRows(original).map((r) => `${r.title}|${r.quote}`));
  const added = accepted.flatMap(rowsOf).filter((r) => !existing.has(`${r.title}|${r.quote}`));
  // The file is sorted by time; a stable sort keeps each minute's existing order and puts new quotes after it.
  const merged = [...lines, ...added.map(formatRow)].sort((a, b) => a.slice(0, 5).localeCompare(b.slice(0, 5)));
  if (!dryRun) await writeFile(csvPath, merged.join('\n') + (original.endsWith('\n') ? '\n' : ''));

  console.log(`${dryRun ? 'Would add' : 'Added'} ${added.length} rows from ${accepted.length} quotes to ${csvPath}`);
  const perBook = new Map<string, number>();
  for (const r of added) perBook.set(r.title, (perBook.get(r.title) ?? 0) + 1);
  for (const [title, n] of perBook) console.log(`  ${title}: ${n}`);
}

const idList = (s: string) => new Set(s.split(/[\s,]+/).filter(Boolean).map(Number));

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    books: { type: 'string' },
    'per-slot': { type: 'string', default: '2' },
    dataset: { type: 'string', default: DEFAULT_DATASET },
    csv: { type: 'string' },
    drop: { type: 'string', default: '' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const dataset = values.dataset ?? DEFAULT_DATASET;
switch (positionals[0]) {
  case 'extract':
    await extract(dataset, Number(values['per-slot'] ?? 2), values.books ? idList(values.books) : undefined);
    break;
  case 'render':
    await render(dataset);
    break;
  case 'merge':
    await merge(values.csv ?? dataset, idList(values.drop ?? ''), values['dry-run'] ?? false);
    break;
  default:
    console.error(USAGE);
    process.exitCode = 1;
}
