## Quoting Clock

This is a clock that tells the time by displaying a quote from a book which mentions that time. This is not an original idea - it started over at the Guardian in 2011 and has been iterated on countless times, with special thanks to JohannesNE over at https://github.com/JohannesNE/literature-clock.

This version? This version is mine.

It's live at https://quotingclock.com.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Runs the test suite in watch mode.

### `npm run build`

Builds the app for production into the `build` folder.

### `npm run deploy`

Builds the app and publishes the `build` folder to GitHub Pages, which serves
https://quotingclock.com (the domain is configured via `public/CNAME`).

## Quote data

The quotes live in `src/components/Clock/litclock.csv`. Despite the
`.csv` extension, the file is **pipe-delimited** (quotes routinely contain
commas), one quote per line, with these columns:

| # | Column      | Example                          | Notes                                              |
|---|-------------|----------------------------------|----------------------------------------------------|
| 0 | Time        | `00:00`                          | 24-hour `HH:MM`; used to match the current minute  |
| 1 | Time phrase | `midnight`                       | The words in the quote that name the time; shown in bold |
| 2 | Quote       | `At midnight the entrances...`   | Line breaks are written `<br/>` — always that form, not `<br>` or `<br />` |
| 3 | Book title  | `Ben-Hur`                        |                                                    |
| 4 | Author      | `Lew Wallace`                    |                                                    |
| 5 | Rating      | `sfw` or `nsfw`                  | `nsfw` quotes only show when "show PG-13 quotes" is on |

To add a quote, append a line in that format. A literal `|` inside any field
will break the column parsing, so don't use one. If several quotes share a
time, one is picked at random each minute.

The time phrase in column 1 must appear in the quote exactly as written —
matching is case-insensitive but otherwise literal, so curly and straight
apostrophes are not interchangeable. Where a quote has been shortened, an
omission inside it is marked `[...]`; omissions at the start or end are left
unmarked.

### Mining quotes from Project Gutenberg

`scripts/quote-miner` finds time quotes in Gutenberg books, writes a numbered
review file, and adds the approved quotes to `litclock.csv`. Run it with
`npm run quotes:extract`, `npm run quotes:render`, and `npm run quotes:merge`.
See [`scripts/quote-miner/README.md`](./scripts/quote-miner/README.md) for the
workflow.

## Credits

- The quotation dataset is adapted from
  [JohannesNE/literature-clock](https://github.com/JohannesNE/literature-clock)
  by Johannes Enevoldsen, licensed under
  [CC BY-NC-SA 2.5](https://creativecommons.org/licenses/by-nc-sa/2.5/), which
  in turn credits Jaap Meijers' e-reader literary clock. It has been modified
  here (quotes added, removed, edited, and re-annotated with sfw/nsfw
  ratings).
- The concept of a clock told through literary quotations originated with a
  2011 project at The Guardian.
- The clock image is by
  [KELLEPICS on Pixabay](https://pixabay.com/photos/fantasy-time-magic-clock-dream-3517206/).

## License

Two licenses, because the two parts have different origins:

- **Source code** — [MIT](https://opensource.org/licenses/MIT). Original work
  of this project, freely reusable including commercially.
- **Quotation dataset** (`src/components/Clock/litclock.csv`) —
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). The
  non-commercial condition is inherited from the upstream collection, not
  added here; CC BY-NC-SA 2.5 §4(b) permits redistributing an adaptation
  under a later version of the same license.

The dataset's non-commercial condition does not extend to the code. See
[`LICENSE`](./LICENSE) for the full terms and attribution.
