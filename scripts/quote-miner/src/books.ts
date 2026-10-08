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
// (as of 2026-10-08), going down the list past the batch already merged
// (Moby-Dick through The Man Who Was Thursday). Skips poetry, plays,
// non-fiction, books not in English, and books litclock.csv already draws on
// heavily (A Study in Scarlet, Around the World in Eighty Days).
// Author spellings follow the ones already in the dataset ("Maurice LeBlanc").
export const BOOKS: Book[] = [
  { id: 59828, title: 'The String of Pearls', author: 'James Malcolm Rymer and Thomas Peckett Prest' },
  { id: 6133, title: 'The Extraordinary Adventures of Arsène Lupin, Gentleman-Burglar', author: 'Maurice LeBlanc' },
  { id: 21839, title: 'Sense and Sensibility', author: 'Jane Austen' },
  { id: 601, title: 'The Monk', author: 'M.G. Lewis' },
  { id: 831, title: 'Four Arthurian Romances', author: 'Chrétien de Troyes' },
  { id: 145, title: 'Middlemarch', author: 'George Eliot' },
  { id: 76639, title: 'Eloisa', author: 'Jean-Jacques Rousseau' },
  { id: 72, title: 'Thuvia, Maid of Mars', author: 'Edgar Rice Burroughs' },
  { id: 19476, title: 'A Honeymoon in Space', author: 'George Griffith' },
  { id: 7326, title: 'The Yeoman Adventurer', author: 'George W. Gough' },
  { id: 468, title: 'Manon Lescaut', author: 'Abbé Prévost' },
  { id: 75201, title: 'A Farewell to Arms', author: 'Ernest Hemingway' },
  { id: 22541, title: 'The Misplaced Battleship', author: 'Harry Harrison' },
  { id: 43, title: 'The Strange Case of Dr. Jekyll and Mr. Hyde', author: 'Robert Louis Stevenson' },
  { id: 8492, title: 'The King in Yellow', author: 'Robert W. Chambers' },
];
