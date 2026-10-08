/**
 * Places quotes whose time is approximate ("nearly eleven o'clock", "just
 * after eight") at a nearby minute instead of on the hour, preferring the
 * minute with the fewest quotes.
 */

export interface Approximation {
  /** The time phrase extended to include its modifier, as written in the quote ("nearly eleven o’clock"). */
  phrase: string;
  /** Minutes relative to the named time to choose from, inclusive. */
  from: number;
  to: number;
}

const MODIFIERS: Array<[RegExp, number, number]> = [
  [/\b(?:long|well|some time) (?:after|past)\s+$/i, 20, 60],
  [/\b(?:nearly|almost|near|close (?:up)?on|hard upon|towards|toward|getting (?:on for|towards)|(?:just|shortly|a little) before|not quite)\s+$/i, -15, -1],
  [/\b(?:(?:just|shortly|soon|a little) after|after|past|gone)\s+$/i, 1, 15],
];

/** The approximation word right before `phrase` in `quote`, if there is one. */
export function findApproximation(quote: string, phrase: string): Approximation | undefined {
  const at = quote.toLowerCase().indexOf(phrase.toLowerCase());
  if (at < 0) return undefined;
  const start = Math.max(0, at - 30);
  const before = quote.slice(start, at);
  for (const [pattern, from, to] of MODIFIERS) {
    const m = pattern.exec(before);
    if (m) return { phrase: quote.slice(start + m.index, at + phrase.length), from, to };
  }
  return undefined;
}

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (t: number) => {
  const m = ((t % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/**
 * The least-crowded minute in the window around `time`; ties go to the one
 * closest to the named time. Bumps `counts` so later quotes spread out.
 */
export function placeNear(time: string, approx: Approximation, counts: Map<string, number>): string {
  const base = toMinutes(time);
  let best: string | undefined;
  let bestScore = Infinity;
  for (let offset = approx.from; offset <= approx.to; offset++) {
    const candidate = toTime(base + offset);
    const score = (counts.get(candidate) ?? 0) * 1000 + Math.abs(offset);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  const chosen = best ?? time;
  counts.set(chosen, (counts.get(chosen) ?? 0) + 1);
  return chosen;
}
