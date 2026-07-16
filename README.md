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
| 2 | Quote       | `At midnight the entrances...`   | May contain `<br/>` for line breaks                |
| 3 | Book title  | `Ben-Hur`                        |                                                    |
| 4 | Author      | `Lew Wallace`                    |                                                    |
| 5 | Rating      | `sfw` or `nsfw`                  | `nsfw` quotes only show when "show PG-13 quotes" is on |

To add a quote, append a line in that format. A literal `|` inside any field
will break the column parsing, so don't use one. If several quotes share a
time, one is picked at random each minute.

## Credits

- The quotation dataset is adapted from
  [JohannesNE/literature-clock](https://github.com/JohannesNE/literature-clock)
  by Johannes Enevoldsen, licensed under
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It has
  been modified here (quotes added, removed, edited, and re-annotated with
  sfw/nsfw ratings).
- The concept of a clock told through literary quotations originated with a
  2011 project at The Guardian.
- The clock image is by
  [KELLEPICS on Pixabay](https://pixabay.com/photos/fantasy-time-magic-clock-dream-3517206/).

## License

This project — both its source code and its quotation dataset — is licensed
under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
inherited from the upstream dataset's share-alike terms. See
[`LICENSE`](./LICENSE) for details and full attribution.
