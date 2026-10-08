import assert from 'node:assert/strict';
import { test } from 'vitest';
import { duplicateFinder, parseRows, rowProblems } from '../src/dataset.ts';
import { excerpt, isHeading, parseBook, sentenceSpans } from '../src/text.ts';
import { findTimes, formatTime, resolveTimes } from '../src/times.ts';

/** The times each phrase in `sentence` resolves to. */
function timesIn(sentence: string): string[][] {
  return findTimes(sentence).map((m) => resolveTimes(m, sentence.replace(m.text, ' ')).minutes.map(formatTime).sort());
}

test('reads clock phrases', () => {
  const cases: Array<[string, string[][]]> = [
    ['The clock struck eleven.', [['11:00', '23:00']]],
    ['It was half-past nine in the morning.', [['09:30']]],
    ['We left at five-and-twenty minutes to six.', [['05:35', '17:35']]],
    ['He came at a quarter before ten at night.', [['21:45']]],
    ['It was ten minutes after midnight.', [['00:10']]],
    ['A quarter of an hour before noon the bell rang.', [['11:45']]],
    ['At three o’clock in the afternoon she rose.', [['15:00']]],
    ['The train leaves at 10.30 a.m. sharp.', [['10:30']]],
    ['They met at midnight.', [['00:00']]],
    ['It was ten to twelve.', [['11:50', '23:50']]],
    ['After dinner, at nine o’clock, they played cards.', [['21:00']]],
    ['It wanted twenty minutes past eleven.', [['11:20', '23:20']]],
    ["Half-past twelve o'clock came.", [['00:30', '12:30']]],
    ['She rose at seven in the morning.', [['07:00']]],
    ['It was eleven o’clock at night.', [['23:00']]],
    ['By a quarter of nine he had gone.', [['08:45', '20:45']]],
    ['At three quarters past ten the coach came.', [['10:45', '22:45']]],
    ['They dined at 18:15.', [['18:15']]],
    ['See Matthew 18:15 for that.', []], // digits need a cue word such as "at" before them
  ];
  for (const [sentence, expected] of cases) assert.deepEqual(timesIn(sentence), expected, sentence);
});

test('ignores numbers that are not times', () => {
  for (const sentence of [
    'He was seven years old.',
    'The odds were five to one.',
    'She spent the afternoon reading.',
    'One of the two men struck one of the others.',
    'There were from ten to twelve people.',
  ]) {
    assert.deepEqual(timesIn(sentence), [], sentence);
  }
});

test('keeps a short phrase for "struck" only with a clock nearby', () => {
  const [match] = findTimes('Then the church clock struck nine.');
  assert.equal(match.text, 'struck nine');
  assert.equal(match.shortPhrase, 'nine');
});

test('rebuilds paragraphs from a Gutenberg file', () => {
  const raw = [
    'Title: Test',
    'Language: English',
    '',
    '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***',
    '',
    'CHAPTER I.',
    '',
    'It was _half-past_ nine when the twenty-',
    'five guests arrived--all at once.',
    '',
    '    The clock strikes one,',
    '    The mouse ran down.',
    '',
    '*** END OF THE PROJECT GUTENBERG EBOOK TEST ***',
    'License text that should be ignored.',
  ].join('\r\n');
  const book = parseBook(raw);
  assert.equal(book.language, 'English');
  assert.deepEqual(book.paragraphs, [
    'CHAPTER I.',
    'It was half-past nine when the twenty-five guests arrived—all at once.',
    'The clock strikes one,<br/>The mouse ran down.',
  ]);
  assert.ok(isHeading(book.paragraphs[0]));
  assert.ok(!isHeading(book.paragraphs[1]));
});

test('splits sentences without breaking on titles', () => {
  const p = 'Mr. Darcy arrived at ten. He left at once! “Why?” asked Mrs. Bennet.';
  assert.deepEqual(sentenceSpans(p).map(([a, b]) => p.slice(a, b)), [
    'Mr. Darcy arrived at ten.',
    'He left at once!',
    '“Why?” asked Mrs. Bennet.',
  ]);
});

test('excerpts stay near the target length and keep the match', () => {
  const filler = 'The rain fell on the long grey roofs of the town without pause. ';
  const p = `${filler.repeat(6)}At half-past four the bell rang. ${filler.repeat(6)}`.trim();
  const at = p.indexOf('half-past four');
  const { text, clipped } = excerpt([p], 0, at, at + 'half-past four'.length);
  assert.ok(text.includes('At half-past four the bell rang.'));
  assert.ok(text.length <= 300, `length ${text.length}`);
  assert.equal(clipped, false);

  const long = `${'and the wind, which had risen, '.repeat(20)}at half-past four${', and the sea rose'.repeat(20)}.`;
  const start = long.indexOf('half-past four');
  const cut = excerpt([long], 0, start, start + 14);
  assert.ok(cut.clipped && cut.text.includes('half-past four') && cut.text.length <= 450);
});

test('validates rows and spots existing quotes', () => {
  const [row] = parseRows('09:30|half-past nine|It was half-past nine and the house was still asleep.|Book|Author|sfw\n');
  assert.deepEqual(rowProblems(row), []);
  assert.deepEqual(rowProblems({ ...row, phrase: 'ten o’clock', rating: 'pg' }), [
    'time phrase "ten o’clock" is not in the quote',
    'bad rating "pg"',
  ]);
  const find = duplicateFinder([row]);
  assert.equal(find('“It was half-past nine and the house was still asleep,” she said.'), row);
  assert.equal(find('It was half-past nine and the dogs were barking in the yard.'), undefined);
});
