import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Verified via YouTube oembed API — all embeddable, no "Video unavailable" */
const trailerUpdates: Record<string, string> = {
  'Inception': 'YoHD9XEInc0',
  'The Dark Knight': 'EXeTwQWrcwY',
  'Interstellar': 'zSWdZVtXT7E',
  'The Shawshank Redemption': 'PLl99DlL6b4',
  'Pulp Fiction': 'tGpTpVyI_OQ',
  'The Godfather': 'sY1S34973zA',
  'Avatar': '5PSNL1qE6VY',
  'Titanic': 'kVrqfYjkTdQ',
  'Avengers: Endgame': 'TcMBFSGVi1c',
  'Spider-Man: No Way Home': 'JfVOs4VSpmA',
  'Joker': 'EAzGXqJSDJ8',
  'Parasite': 'isOGD_7hNIY',
  'Everything Everywhere All at Once': 'wxN1T1uxQ2g',
  'Oppenheimer': 'uYPbbksJxIg',
  'Dune': 'n9xhJrPXop4',
  'Top Gun: Maverick': 'qSqVVswa420',
  'Black Panther': 'xjDjIWPwcPU',
  'The Matrix': 'm8e-FF8MsqU',
  'Gladiator': 'P5ieIbInFpg',
  'La La Land': 'lu4RHvouJH8',
  'Get Out': 'DzfpyUB60YY',
  'Mad Max: Fury Road': 'hEJnMQG9ev8',
  'The Social Network': 'lB95KLmpLR4',
  'Whiplash': '7d_jQycdQGo',
  'Knives Out': 'qOg3AoRc4nI',
  'Spider-Man: Into the Spider-Verse': 'g4Hbz2jLxvQ',
};

async function main() {
  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, trailerId: true },
    orderBy: { id: 'asc' },
  });

  let updated = 0;
  for (const movie of movies) {
    const nextTrailer = trailerUpdates[movie.title];
    if (!nextTrailer) {
      console.log(`SKIP (no mapping): ${movie.title}`);
      continue;
    }
    if (movie.trailerId === nextTrailer) {
      console.log(`OK (unchanged): ${movie.title} -> ${nextTrailer}`);
      continue;
    }
    await prisma.movie.update({
      where: { id: movie.id },
      data: { trailerId: nextTrailer },
    });
    console.log(`UPDATED: ${movie.title}: ${movie.trailerId} -> ${nextTrailer}`);
    updated++;
  }

  console.log(`\n${updated} movie trailer(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
