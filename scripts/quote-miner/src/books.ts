export interface Book {
  /** Project Gutenberg ebook number. */
  id: number;
  /** Title and author as they should appear in litclock.csv. */
  title: string;
  author: string;
  /** Other titles this book already appears under in litclock.csv. */
  aliases?: string[];
}

// Most-downloaded English fiction on Gutenberg over the last thirty days
// (as of 2026-10-08), skipping books litclock.csv already draws on heavily.
// Author spellings follow the ones already in the dataset ("G.K. Chesterton").
export const BOOKS: Book[] = [
  { id: 2701, title: 'Moby-Dick', author: 'Herman Melville', aliases: ['Moby Dick'] },
  { id: 2641, title: 'A Room with a View', author: 'E.M. Forster' },
  { id: 65238, title: 'The Secret of Chimneys', author: 'Agatha Christie' },
  { id: 3268, title: 'The Mysteries of Udolpho', author: 'Ann Radcliffe' },
  { id: 2465, title: 'Carmen', author: 'Prosper Mérimée' },
  { id: 67979, title: 'The Blue Castle', author: 'L.M. Montgomery' },
  { id: 2868, title: 'The Green Mummy', author: 'Fergus Hume' },
  { id: 11, title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', aliases: ['Alice in Wonderland'] },
  { id: 1695, title: 'The Man Who Was Thursday', author: 'G.K. Chesterton' },
  // Left out because the dataset already has several quotes from them:
  // { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen' },                 // 8
  // { id: 2554, title: 'Crime and Punishment', author: 'Fyodor Dostoyevsky' },        // 7
  // { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Sir Arthur Conan Doyle' }, // 25
  // { id: 1260, title: 'Jane Eyre', author: 'Charlotte Brontë' },                     // 9
  // { id: 345, title: 'Dracula', author: 'Bram Stoker' },                             // 8
];
