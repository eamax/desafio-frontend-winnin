// Historical Figma copy, intentionally separate from live AniList production data.
// Artwork is a neutral deterministic fixture, not an export of copyrighted covers.
const artwork = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="317" height="270"><rect width="317" height="270" fill="#b7bac4"/></svg>')}`;
const rows: { title: string; genres: string[]; averageScore: number }[] = [
  {
    title: 'Zom 100: Zombie ni Naru Made\nni Shitai 100 no Koto',
    genres: ['Action', 'Comedy', 'Horror'],
    averageScore: 80,
  },
  {
    title: 'Mushoku Tensei II: Isekai Ittara Honki Dasu',
    genres: ['Adventure', 'Drama', 'Ecchi'],
    averageScore: 83,
  },
  {
    title: 'One Piece',
    genres: ['Action', 'Comedy', 'Adventure'],
    averageScore: 87,
  },
  {
    title: 'Masamune-jun no Revenge R',
    genres: ['Romance', 'Comedy'],
    averageScore: 70,
  },
  {
    title: 'Bleach: Sennen Kessen-hen - Ketsubetsu-tan',
    genres: ['Action', 'Adventure'],
    averageScore: 87,
  },
  {
    title: 'Lv1 Maou to One Room Yuusha',
    genres: ['Action', 'Comedy', 'Adventure'],
    averageScore: 48,
  },
  {
    title: 'Jujutsu Kaisen 2nd Season',
    genres: ['Action', 'Drama'],
    averageScore: 86,
  },
  { title: 'Horimiya: piece', genres: ['Comedy', 'Romance'], averageScore: 81 },
  {
    title: 'Watashi no Shiawase na Kekkon',
    genres: ['Drama', 'Romance'],
    averageScore: 81,
  },
  {
    title: 'Tate no Yuusha no Nariagari',
    genres: ['Action', 'Adventure', 'Fantasy'],
    averageScore: 83,
  },
  {
    title: 'Goblin Slayer II',
    genres: ['Action', 'Adventure', 'Fantasy'],
    averageScore: 78,
  },
  {
    title: 'Shingeki no Kyojin: The Final Season - Kanketsu...',
    genres: ['Action', 'Drama', 'Fantasy'],
    averageScore: 79,
  },
];

export const referenceMedia = rows.map((row, index) => ({
  id: index + 1,
  title: { romaji: row.title, english: null, native: null },
  genres: row.genres,
  averageScore: row.averageScore,
  coverImage: { large: artwork },
}));
