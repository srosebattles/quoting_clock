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
// (as of 2026-10-08), continuing down the list past the two batches already
// merged. Skips poetry, plays, non-fiction, books not in English, books
// litclock.csv already draws on heavily (A Study in Scarlet, Around the World
// in Eighty Days), and two left out by choice (The Sex Life of the Gods,
// I Am a Woman). Author spellings follow the ones already in the dataset.
export const BOOKS: Book[] = [
  { id: 37106, title: 'Little Women', author: 'Louisa May Alcott' },
  { id: 564, title: 'The Mystery of Edwin Drood', author: 'Charles Dickens' },
  { id: 1184, title: 'The Count of Monte Cristo', author: 'Alexandre Dumas' },
  { id: 730, title: 'Oliver Twist', author: 'Charles Dickens' },
  { id: 1259, title: 'Twenty Years After', author: 'Alexandre Dumas' },
  { id: 36462, title: 'King Arthur and the Knights of the Round Table', author: 'Sir Thomas Malory' },
  { id: 393, title: 'The Blue Lagoon', author: 'H. De Vere Stacpoole' },
  { id: 53874, title: 'Under the Red Dragon', author: 'James Grant' },
  { id: 24793, title: 'Blow the Man Down', author: 'Holman Day' },
  { id: 589, title: 'Catriona', author: 'Robert Louis Stevenson' },
  { id: 23784, title: 'The History of Sir Richard Calmady', author: 'Lucas Malet' },
  { id: 2852, title: 'The Hound of the Baskervilles', author: 'Sir Arthur Conan Doyle' },
  { id: 42389, title: 'The Pirate', author: 'Walter Scott' },
];
