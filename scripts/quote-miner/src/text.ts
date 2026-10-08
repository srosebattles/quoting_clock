/**
 * Downloads Gutenberg plain-text books, rebuilds their paragraphs, and cuts
 * quote-sized excerpts around a match.
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);

const START_MARKER = /^\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG E-?BOOK[^\n]*$/im;
const END_MARKER = /^\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG E-?BOOK[^\n]*$/im;

/** Excerpts aim for this many characters, and only go past MAX when a sentence can't be cut. */
const TARGET = 300;
const MAX = 450;
/** A whole paragraph shorter than this borrows a neighbouring paragraph for context. */
const SHORT = 100;

type Span = [number, number];

async function isComplete(file: string): Promise<boolean> {
  try {
    return END_MARKER.test(await readFile(file, 'utf8'));
  } catch {
    return false;
  }
}

/** Downloads (or reuses) pg{id}.txt in `dir` and returns its path. */
export async function downloadBook(id: number, dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = join(dir, `pg${id}.txt`);
  const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
  if (await isComplete(file)) return file;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      // Transfers through this session's proxy sometimes drop partway, so retries resume with -C -.
      // The first attempt starts over: a leftover file may already be whole, just without an
      // end-of-book marker, and resuming it would fail with "range not satisfiable".
      const resume = attempt > 1 ? ['-C', '-'] : [];
      await run('curl', ['-sS', '--fail', '--http1.1', ...resume, '--max-time', '180', '-o', file, url]);
      if (!(await isComplete(file))) console.warn(`  pg${id}: downloaded, but found no end-of-book marker`);
      return file;
    } catch (err) {
      if (await isComplete(file)) return file;
      console.warn(`  pg${id}: download attempt ${attempt} failed: ${String((err as Error).message).split('\n')[0]}`);
      await sleep(2 ** attempt * 1000);
    }
  }
  throw new Error(`Could not download ${url}`);
}

export interface BookText {
  language?: string;
  paragraphs: string[];
}

export function parseBook(raw: string): BookText {
  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const start = START_MARKER.exec(text);
  const end = END_MARKER.exec(text);
  const header = start ? text.slice(0, start.index) : '';
  const body = text.slice(start ? start.index + start[0].length : 0, end ? end.index : text.length);
  return {
    language: /^Language:\s*(.+)$/m.exec(header)?.[1]?.trim(),
    paragraphs: body
      .split(/\n[ \t]*\n/)
      .map(cleanParagraph)
      .filter((p) => p && !/^\[(?:Illustration|Footnote)/i.test(p)),
  };
}

function cleanParagraph(block: string): string {
  const lines = block.split('\n').filter((l) => l.trim());
  if (!lines.length) return '';
  // Short, uniformly indented lines are verse; keep their line breaks.
  const verse = lines.length > 1 && lines.every((l) => /^\s{2,}\S/.test(l)) && Math.max(...lines.map((l) => l.trim().length)) < 60;
  const trimmed = lines.map((l) => l.trim());
  const joined = verse
    ? trimmed.join('<br/>')
    : trimmed.reduce((acc, l) => (/\p{L}-$/u.test(acc) ? acc + l : `${acc} ${l}`));
  return joined
    .replace(/\[Pg \d+\]/g, '')
    .replace(/_([^_]+)_/g, '$1') // Gutenberg marks italics with underscores
    .replace(/\s*--\s*/g, '—')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Chapter headings, tables of contents, and other non-prose lines. */
export function isHeading(p: string): boolean {
  return (
    /^(?:chapter|book|part|volume|act|scene|letter)\s+[IVXLCDM\d]+\b/i.test(p) ||
    (/\p{L}/u.test(p) && p === p.toUpperCase()) ||
    (p.length < 60 && !/[.!?…”’"')]$/.test(p))
  );
}

const isProse = (p: string) => !isHeading(p) && /[.!?…”’"')]$/.test(p);

const SENTENCE_END = /[.!?…]+[”’"')\]]*(?=\s+[“‘"'(\[]*[\p{Lu}\d])/gu;
const ABBREVIATION = /(?:\b(?:Mr|Mrs|Messrs|Mme|Mlle|Mons|Dr|St|Capt|Col|Gen|Lieut|Rev|Hon|Sr|Jr|No|Vol|viz|vs|etc)|\b[ap]\.m|(?:^|[\s(“"'‘])\p{Lu})\.$/u;

export function sentenceSpans(p: string): Span[] {
  const spans: Span[] = [];
  let start = 0;
  for (const m of p.matchAll(SENTENCE_END)) {
    if (m[0].startsWith('.') && !m[0].startsWith('..') && ABBREVIATION.test(p.slice(Math.max(0, m.index - 12), m.index + 1))) continue;
    const end = m.index + m[0].length;
    spans.push([start, end]);
    start = end;
    while (start < p.length && /\s/.test(p[start])) start++;
  }
  if (start < p.length) spans.push([start, p.length]);
  return spans;
}

/** Narrows an over-long sentence to the clauses around the match. */
function clip(p: string, [s, e]: Span, start: number, end: number): Span {
  const breaks = [...p.slice(s, e).matchAll(/[,;:]\s+|\s*[—–]\s*/g)].map((m) => [s + m.index, s + m.index + m[0].length]);
  const starts = [s, ...breaks.map(([, after]) => after).filter((a) => a <= start)];
  const ends = [...breaks.map(([before]) => before).filter((b) => b >= end), e];
  let a = starts.length - 1;
  let b = 0;
  for (let grew = true; grew; ) {
    grew = false;
    if (b + 1 < ends.length && ends[b + 1] - starts[a] <= TARGET) {
      b++;
      grew = true;
    }
    if (a > 0 && ends[b] - starts[a - 1] <= TARGET) {
      a--;
      grew = true;
    }
  }
  let lo = starts[a];
  let hi = ends[b];
  if (hi - lo > MAX) {
    // No usable clause breaks: cut at word boundaries instead.
    const from = p.indexOf(' ', Math.max(lo, start - 150));
    if (from !== -1 && from < start) lo = from + 1;
    const to = p.lastIndexOf(' ', Math.min(hi, end + 150));
    if (to > end) hi = to;
  }
  return [lo, hi];
}

export interface Excerpt {
  text: string;
  /** True when the excerpt starts or ends partway through a sentence. */
  clipped: boolean;
}

/** Whole sentences around [start, end) in paragraph `index`, up to about TARGET characters. */
export function excerpt(paragraphs: string[], index: number, start: number, end: number): Excerpt {
  const p = paragraphs[index];
  const sentences = sentenceSpans(p);
  let lo = Math.max(0, sentences.findIndex(([, e]) => e > start));
  let hi = lo;
  while (hi + 1 < sentences.length && sentences[hi][1] < end) hi++;
  const width = (a: number, b: number) => sentences[b][1] - sentences[a][0];

  if (width(lo, hi) > MAX) {
    const [a, b] = clip(p, [sentences[lo][0], sentences[hi][1]], start, end);
    return { text: p.slice(a, b).trim(), clipped: true };
  }
  for (let grew = true; grew; ) {
    grew = false;
    if (hi + 1 < sentences.length && width(lo, hi + 1) <= TARGET) {
      hi++;
      grew = true;
    }
    if (lo > 0 && width(lo - 1, hi) <= TARGET) {
      lo--;
      grew = true;
    }
  }
  let text = p.slice(sentences[lo][0], sentences[hi][1]).trim();
  if (lo === 0 && hi === sentences.length - 1 && text.length < SHORT) {
    const prev = paragraphs[index - 1];
    if (prev && isProse(prev) && prev.length + text.length <= TARGET) text = `${prev}<br/>${text}`;
    const next = paragraphs[index + 1];
    if (text.length < SHORT && next && isProse(next) && next.length + text.length <= TARGET) text = `${text}<br/>${next}`;
  }
  return { text, clipped: false };
}
