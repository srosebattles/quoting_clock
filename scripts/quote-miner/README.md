# quote-miner

Finds clock-time quotes in Project Gutenberg books and adds the approved ones
to `src/components/Clock/litclock.csv`. It needs Node 22.18 or later, which
runs the TypeScript directly, and `curl`.

## Layout

- `src/books.ts`: the books to search, with the title and author spellings to use in the CSV.
- `src/times.ts`: finds time phrases ("half-past nine," "five-and-twenty minutes to six," "the clock struck eleven") and works out which minutes they name.
- `src/text.ts`: downloads books, strips Gutenberg's header and footer, rebuilds paragraphs, and cuts excerpts.
- `src/dataset.ts`: reads and checks `litclock.csv` and spots passages it already has.
- `src/cli.ts`: the `extract`, `render`, and `merge` commands.
- `.work/`: downloaded books, candidates, decisions, and the review file. Git ignores this folder.

`npm test` includes this tool's unit tests, and `npm run quotes:typecheck` type-checks it. Neither touches the network.

## Running it

Run every command from the repository root.

1. Edit the list in `src/books.ts`.
2. `npm run quotes:extract` downloads the books and writes `.work/out/candidates.json` and `candidates.md`. It skips passages already in the dataset and keeps at most two candidates per book per minute.
   `-- --books 2701,11` limits the run to some books, and `-- --per-slot 1` keeps fewer candidates.
   Re-running `extract` renumbers the candidates, so start a fresh `decisions.json` afterward.
   Books are downloaded once and reused from `.work/texts/`. A book without Gutenberg's end-of-book marker gets a warning and is downloaded again on each run.
3. Review pass: read `candidates.md` and write `.work/out/decisions.json` using the rules below.
4. `npm run quotes:render` writes `.work/quote-review.md`, with each quote numbered and its time phrase bolded.
5. Record cuts (`"drop": "cut by reviewer"`) and changes in `decisions.json`, then render again.
6. `npm run quotes:merge -- --dry-run` shows what would be added. Run it again without `--dry-run` to add the rows to `litclock.csv` in time order. `-- --drop 3,17` skips candidates without editing `decisions.json`.

`extract`, `render`, and `merge` read the dataset from `src/components/Clock/litclock.csv` unless you pass `-- --dataset path/to/other.csv`. For `merge`, `-- --csv path/to/other.csv` does the same thing: `merge` reads that file and adds the rows to it.

## decisions.json

This file is keyed by candidate number. Any candidate it doesn't list goes in unchanged, rated SFW.

```json
{
  "3": { "drop": "an age, not a time" },
  "8": { "times": ["21:00"] },
  "12": { "rating": "nsfw" },
  "15": { "quote": "…", "phrase": "…", "note": "shortened" },
  "20": { "times": ["22:00"], "exact": true }
}
```

### Approximate times

When a word like "nearly," "almost," "towards," or "hard upon" comes right before the time phrase, `render` and `merge` move the quote into the fifteen minutes before the named time. "After," "just after," or "past" moves it into the fifteen minutes after, and "long after" or "well past" moves it twenty to sixty minutes after. Within that window the quote goes to the minute with the fewest quotes, counting quotes already placed in the same run. The modifier joins the bolded phrase ("nearly eleven o’clock"). "About" leaves the time alone, and `"exact": true` in `decisions.json` keeps the given `times`.

## Review-pass rules

- Drop a candidate when its phrase isn't a clock time (an age, a count, odds, a range such as "from ten to twelve," or a chapter title) or when the excerpt makes no sense on its own.
- Drop noon or midnight used figuratively ("the noon of life") unless the passage is striking.
- a.m. or p.m.: when one reading of a `both` candidate falls in the small hours (roughly midnight to six) and the activity is implausible then (guests arriving by train at 3.40, a checkout before twelve), set `times` to the other reading even without an explicit clue. When both readings are ordinary waking hours, such as seven or nine, leave both unless the passage settles it. Check every `inferred` candidate too.
- Rate a quote `nsfw` for sexual content, graphic violence, strong profanity, any drug stronger than alcohol (opium, laudanum, a sleeping draught), or any reference to suicide, even one that happens offstage. These quotes show only when the clock's "show PG-13 quotes" setting is on.
- Edit a quote only to fix where the excerpt starts or ends, and never reword it. Mark omissions inside a quote with `[...]` and leave omissions at the start or end unmarked. The time phrase must stay in the quote exactly as written. Don't use `|`, and write line breaks as `<br/>`.
- `book-has-time` means the dataset already has a quote from this book at that minute, possibly in another translation. Drop the candidate if it's the same passage.
- Aim for quotes of about 150 to 350 characters.

## What it deliberately skips

- A bare hour such as "at nine," which matches too many things that aren't times.
- Ship's bells.
- Digit times like "10.30" unless a word such as "at" or "the" comes before them.
