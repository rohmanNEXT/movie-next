const UA = 'Mozilla/5.0';

/** Verified official trailer candidates per film */
const trailers = {
  'Inception': ['YoHD9XEInc0', 'Jvurpf3alrY'],
  'The Dark Knight': ['EXeTwQWrcwY', 'LDG9bisJEaI'],
  'Interstellar': ['zSWdZVtXT7E', '2LqzF5WauAw'],
  'The Shawshank Redemption': ['Pl9WJw_fze4', '6hBqVZZCges', 'NmzuHjWmX5s', 'xyXX8LXiN_0'],
  'Pulp Fiction': ['tGpTpVyI_OQ', 's7EdQd6kzBs'],
  'The Godfather': ['sY1S34973zA', 'UaVTIH8mujA'],
  'Avatar': ['a7c3L7YoWpE', '5PSNL14qKrE', 'd9MyW72ELq0', '17V3JlD6jUP'],
  'Titanic': ['kVrqfYjkTdQ', 'CHekzUmzLkc', 'c8sRgE_80io'],
  'Avengers: Endgame': ['TzBN0ao43o4', 'TADBroooVPw', 'TcMBFJY8E7o', 'eOrNdBpGvI8'],
  'Spider-Man: No Way Home': ['JfVOs4VSpmA', 'rt-2Mgk3FFU'],
  'Joker': ['EAzGXqJSDJ8', 'zAGVQLH1bUI', 'zSkxeqjJk6I'],
  'Parasite': ['isOGD_7hNIY', '5xH0HfJHsaY'],
  'Everything Everywhere All at Once': ['jjk3PVMjHKE', 'wxN1T1vxT9o', 'weIEegH0LMY'],
  'Oppenheimer': ['8glpazRjb7o', 'uLtkt8BonwM', 'uYP2gPw5mD0', 'bG6CZS8v2Ac'],
  'Dune': ['n9xhJrPXop4', '8g18yBAAayY'],
  'Top Gun: Maverick': ['qSqVVswa420', 'giXco2jaZ_4'],
  'Black Panther': ['d96cgFxHxbA', 'xjDjIWPYESU', 'QtNKAJhN0GU'],
  'The Matrix': ['m8e-FF8MsqU', 'vKQi3-q6fHg', 'nUEQNVVn31E'],
  'Gladiator': ['P5ieIbInFpg', 'owK1qxDhlEk'],
  'La La Land': ['0pdqf4P9M8A', '_LAAX6PmQKQ', 'TrzBPaZnJy0'],
  'Get Out': ['DzfpyUB60YY', 'D8sH5aRFbaw', 'sRfneSExNag'],
  'Mad Max: Fury Road': ['WLpn3oKXKpU', 'hEJnMqG9d8o', 'hA2ple9q4sQN'],
  'The Social Network': ['lB95KL-mpL8', 'Lgb1X3DEgsE', 'uK7FWKeNKKA'],
  'Whiplash': ['7CLfAm8f8J8', 'TB7H7Ip2l-s', 'EJz6YhC6P70'],
  'Knives Out': ['2i_WTotBuHo', 'qGqiFjh2R7Y', 'pVi8R8KOjvM'],
  'Spider-Man: Into the Spider-Verse': ['g4Hbz2jLxvQ', 'gkC6iBBCKzs', 'iiZZdoQBEHYvzaAKJo-WFRcHlV4'],
};

async function isEmbeddable(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': UA } },
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const result = {};
  for (const [title, ids] of Object.entries(trailers)) {
    for (const id of ids) {
      const ok = await isEmbeddable(id);
      console.log(`${ok ? 'OK' : 'NO'} ${title} -> ${id}`);
      if (ok && !result[title]) result[title] = id;
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  console.log('\n--- SELECTED ---');
  console.log(JSON.stringify(result, null, 2));
  const missing = Object.keys(trailers).filter((t) => !result[t]);
  if (missing.length) console.log('\nMISSING:', missing.join(', '));
}

main();
