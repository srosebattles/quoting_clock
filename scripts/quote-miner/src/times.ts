/**
 * Finds phrases that name a clock time in English prose ("half-past nine",
 * "five-and-twenty minutes to six", "the clock struck eleven") and works out
 * which minutes of the day each one could mean.
 */

/** Minute-of-day ranges, each [start, end). */
export type Window = ReadonlyArray<readonly [number, number]>;

export type Confidence = 'high' | 'medium' | 'low';

/**
 * How the a.m./p.m. question was settled: the phrase has only one reading
 * (fixed), the text says so (stated), nearby words suggest it (inferred), or
 * it stays open and the quote goes in at both times (both).
 */
export type AmPm = 'fixed' | 'stated' | 'inferred' | 'both';

export interface TimeMatch {
  /** Offsets of the matched text in the searched string. */
  start: number;
  end: number;
  /** The matched text, including a trailing qualifier such as "in the morning". */
  text: string;
  /** A shorter phrase to bold instead, if it occurs only once in the quote ("eleven" in "struck eleven"). */
  shortPhrase?: string;
  /** Minute-of-day values (0–1439) the phrase could mean. */
  minutes: number[];
  /** The range named by an explicit qualifier ("in the morning", "p.m."). */
  window?: Window;
  confidence: Confidence;
  kind: string;
}

const MORNING: Window = [[0, 720]];
const AFTERNOON: Window = [[720, 1140]];
const EVENING: Window = [[960, 1440]];
const NIGHT: Window = [[1140, 1440], [0, 360]];
const PM: Window = [[720, 1440]];

const UNIT_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEEN_WORDS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS_WORDS = ['twenty', 'thirty', 'forty', 'fifty'];

const WORD_VALUES = new Map<string, number>([
  ...UNIT_WORDS.map((w, i): [string, number] => [w, i + 1]),
  ...TEEN_WORDS.map((w, i): [string, number] => [w, i + 10]),
  ...TENS_WORDS.map((w, i): [string, number] => [w, (i + 2) * 10]),
]);

const alt = (words: string[]) => `(?:${words.join('|')})`;
const UNIT = alt(UNIT_WORDS);
const TENS = alt(TENS_WORDS);
// "twenty-five", "twenty five", "five-and-twenty", "fourteen", "7"
const NUMBER = `(?:${TENS}(?:[- ]${UNIT})?|${UNIT}[- ]and[- ]${TENS}|${alt(TEEN_WORDS)}|${UNIT}|\\d{1,2})`;
const HOUR_WORD = alt([...UNIT_WORDS, 'ten', 'eleven', 'twelve']);
const HOUR = `(?:${HOUR_WORD}|\\d{1,2})`;
const OCLOCK = `(?:o[’']\\s?clock|o-clock|of the clock)`;
const AMOUNT = `(?:half[- ]an[- ]hour|half|(?:a\\s+)?quarter(?:\\s+of\\s+an\\s+hour)?|three[- ]quarters(?:\\s+of\\s+an\\s+hour)?|an\\s+hour|${NUMBER}(?:\\s+minutes?)?)`;
const HOUR_REF = `(?:twelve\\s+(?:noon|midnight)|noon|midnight|mid-?day|${HOUR}(?:\\s+${OCLOCK})?)`;
const PERIOD = '(?:morning|forenoon|afternoon|evening|night)';
const QUALIFIER = `(?:in the ${PERIOD}|of the ${PERIOD}|at night|to-?night|(?:this|that|next|to-?morrow|yesterday) ${PERIOD}|[ap]\\.\\s?m\\.)`;

const RELATIVE = new RegExp(`\\b(${AMOUNT})[\\s-]+(past|after|to|before|of|till|until)\\s+(${HOUR_REF})\\b`, 'gi');
const OCLOCK_TIME = new RegExp(`\\b(${HOUR})\\s*${OCLOCK}`, 'gi');
const NOON_MIDNIGHT = /\b(?:twelve\s+)?(noon|midnight|mid-?day)\b/gi;
const AMPM = new RegExp(`\\b(${HOUR})(?:[:.]([0-5]\\d))?\\s*([ap])\\.\\s?m\\.`, 'gi');
const DIGITS = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g;
const STRUCK = new RegExp(`\\b(?:struck|strikes|striking|strike|chimed|chimes|chiming|tolled|tolls|tolling)\\s+(?:the\\s+hour\\s+of\\s+)?(${HOUR_WORD}|noon|midnight)\\b`, 'gi');
const HOUR_STRUCK = new RegExp(`\\b(${HOUR_WORD})\\s+(?:struck|was striking|had struck|had just struck)\\b`, 'gi');
const HOUR_QUALIFIED = new RegExp(`\\b(${HOUR_WORD})(?=\\s+${QUALIFIER}(?!\\w))`, 'gi');
const QUALIFIER_AFTER = new RegExp(`^\\s+(${QUALIFIER})(?!\\w)`, 'i');

// "ten to six" is only a time after words like these; otherwise it's odds or a range.
const CUE_BEFORE_TO = /\b(?:at|about|nearly|almost|till|until|by|exactly|precisely|just|was|is)\s+$/i;
const CUE_BEFORE_DIGITS = /\b(?:at|about|by|till|until|before|after|past|from|since|nearly|almost|the|of)\s+$/i;
const CLOCK_CONTEXT = /\b(?:clocks?|bells?|chimes?|church|steeple|tower|belfry|cathedral|abbey|minster|convent|hour|watch)\b/i;

// Words elsewhere in a quote that hint at the time of day.
const CUES: Array<[RegExp, Window]> = [
  [/\b(?:morning|forenoon|breakfast|breakfasted|dawn|daybreak|sunrise)\b/i, MORNING],
  [/\b(?:afternoon|luncheon|lunch)\b/i, AFTERNOON],
  [/\b(?:evening|dinner|dined|supper|sunset|dusk|twilight)\b/i, EVENING],
  [/\b(?:night|midnight|bedtime|to-?night|moonlight)\b/i, NIGHT],
];

interface Reading {
  minutes: number[];
  confidence: Confidence;
  kind: string;
  window?: Window;
  shortPhrase?: string;
}

type Reader = (m: RegExpExecArray, text: string) => Reading | undefined;

const mod = (t: number) => ((t % 1440) + 1440) % 1440;
const within = (t: number, window: Window) => window.some(([from, to]) => t >= from && t < to);
const before = (m: RegExpExecArray, text: string, chars: number) => text.slice(Math.max(0, m.index - chars), m.index);

export const formatTime = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

function parseNumber(text: string): number {
  if (/^\d+$/.test(text)) return Number(text);
  const words = text.toLowerCase().split(/[- ]+/).filter((w) => w !== 'and');
  return words.reduce((sum, w) => sum + (WORD_VALUES.get(w) ?? NaN), 0);
}

/** Both twelve-hour readings of an hour, or the one reading of noon or midnight. */
function hourMinutes(ref: string): number[] | undefined {
  const r = ref.toLowerCase();
  if (/noon|mid-?day/.test(r)) return [720];
  if (r.includes('midnight')) return [0];
  const h = parseNumber(r.split(/\s/)[0]);
  if (!(h >= 1 && h <= 12)) return undefined;
  return [(h % 12) * 60, (h % 12) * 60 + 720];
}

function parseAmount(text: string): { minutes: number; unit: 'half' | 'quarter' | 'hour' | 'minutes' | 'bare' } | undefined {
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  if (/^half[- ]an[- ]hour$/.test(t)) return { minutes: 30, unit: 'hour' };
  if (t === 'half') return { minutes: 30, unit: 'half' };
  if (t.startsWith('three') && t.includes('quarter')) return { minutes: 45, unit: 'quarter' };
  if (t.includes('quarter')) return { minutes: 15, unit: 'quarter' };
  if (t === 'an hour') return { minutes: 60, unit: 'hour' };
  const n = parseNumber(t.replace(/ minutes?$/, ''));
  if (!(n >= 1 && n <= 59)) return undefined;
  return { minutes: n, unit: / minutes?$/.test(t) ? 'minutes' : 'bare' };
}

function windowFor(qualifier: string): Window {
  const q = qualifier.toLowerCase();
  if (/p\.\s?m/.test(q)) return PM;
  if (/morning|forenoon|a\.\s?m/.test(q)) return MORNING;
  if (q.includes('afternoon')) return AFTERNOON;
  if (q.includes('evening')) return EVENING;
  return NIGHT;
}

const readRelative: Reader = (m, text) => {
  const amount = parseAmount(m[1]);
  const relation = m[2].toLowerCase();
  const base = hourMinutes(m[3]);
  if (!amount || !base) return undefined;
  const anchored = /noon|midnight|mid-?day|clock/i.test(m[3]);
  let confidence: Confidence = 'high';
  if (amount.unit === 'bare') {
    if (relation === 'past') confidence = anchored ? 'high' : 'medium';
    else if (relation === 'to' && (anchored || CUE_BEFORE_TO.test(before(m, text, 20)))) confidence = anchored ? 'high' : 'low';
    else return undefined;
  } else if (['of', 'till', 'until'].includes(relation) && amount.unit !== 'quarter' && amount.unit !== 'minutes') {
    return undefined;
  } else if (amount.unit === 'half' && relation !== 'past' && relation !== 'after') {
    return undefined;
  }
  const sign = relation === 'past' || relation === 'after' ? 1 : -1;
  return { minutes: base.map((b) => mod(b + sign * amount.minutes)), confidence, kind: 'relative' };
};

const readStruck = (confidence: Confidence): Reader => (m, text) => {
  if (!CLOCK_CONTEXT.test(before(m, text, 100))) return undefined;
  const base = hourMinutes(m[1]);
  return base && { minutes: base, confidence, kind: 'struck', shortPhrase: m[1] };
};

const PATTERNS: Array<[RegExp, Reader]> = [
  [RELATIVE, readRelative],
  [OCLOCK_TIME, (m) => {
    const base = hourMinutes(m[1]);
    return base && { minutes: base, confidence: 'high', kind: 'oclock' };
  }],
  [NOON_MIDNIGHT, (m) => /noon|mid-?day/i.test(m[1])
    ? { minutes: [720], confidence: 'medium', kind: 'noon' }
    : { minutes: [0], confidence: 'medium', kind: 'midnight' }],
  [AMPM, (m) => {
    const h = parseNumber(m[1]);
    if (!(h >= 1 && h <= 12)) return undefined;
    const t = (h % 12) * 60 + Number(m[2] ?? 0);
    return { minutes: [t, t + 720], window: m[3].toLowerCase() === 'p' ? PM : MORNING, confidence: 'high', kind: 'ampm' };
  }],
  [DIGITS, (m, text) => {
    if (!CUE_BEFORE_DIGITS.test(before(m, text, 12))) return undefined;
    const h = Number(m[1]);
    const t = h * 60 + Number(m[2]);
    const minutes = h === 0 || h > 12 ? [t] : [t % 720, (t % 720) + 720];
    return { minutes, confidence: 'medium', kind: 'digits' };
  }],
  [STRUCK, readStruck('high')],
  [HOUR_STRUCK, readStruck('low')],
  [HOUR_QUALIFIED, (m) => {
    const base = hourMinutes(m[1]);
    return base && { minutes: base, confidence: 'medium', kind: 'qualified' };
  }],
];

/** Every time phrase in `text`, keeping the longest where matches overlap. */
export function findTimes(text: string): TimeMatch[] {
  const found: TimeMatch[] = [];
  for (const [pattern, read] of PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const reading = read(m, text);
      if (!reading) continue;
      const start = m.index;
      let end = start + m[0].length;
      let window = reading.window;
      if (!window && reading.minutes.length > 1) {
        const qualifier = QUALIFIER_AFTER.exec(text.slice(end));
        if (qualifier) {
          end += qualifier[0].length;
          window = windowFor(qualifier[1]);
        }
      }
      found.push({ ...reading, start, end, window, text: text.slice(start, end) });
    }
  }
  const kept: TimeMatch[] = [];
  for (const match of found.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start)) {
    if (kept.every((k) => match.end <= k.start || match.start >= k.end)) kept.push(match);
  }
  return kept.sort((a, b) => a.start - b.start);
}

/** Settles a.m. or p.m. from the phrase itself, then from `context` (the quote minus the phrase). */
export function resolveTimes(match: TimeMatch, context: string): { minutes: number[]; ampm: AmPm } {
  const { minutes, window } = match;
  if (minutes.length === 1) return { minutes, ampm: 'fixed' };
  if (window) {
    const stated = minutes.filter((t) => within(t, window));
    if (stated.length) return { minutes: stated, ampm: 'stated' };
  }
  const scores = minutes.map((t) => CUES.filter(([cue, w]) => cue.test(context) && within(t, w)).length);
  const best = Math.max(...scores);
  if (best > 0 && scores.some((s) => s < best)) {
    return { minutes: minutes.filter((_, i) => scores[i] === best), ampm: 'inferred' };
  }
  return { minutes, ampm: 'both' };
}
