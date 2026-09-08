const ids = [
  ['Avengers Endgame', 'TcMBFSGVi1c'],
  ['Avengers Endgame', 'ee1172yeqyE'],
  ['Avengers Endgame', '0jNvJU52LvU'],
  ['Shawshank', 'PLl99DlL6b4'],
  ['Shawshank', 'NmzuHjWmXOc'],
  ['EEAAO', 'jjk3PVMjHKE'],
  ['EEAAO', 'wxN1T1vxT9o'],
  ['EEAAO', 'weIEegH0LMY'],
  ['EEAAO', 'wL1LmF8Z4XM'],
  ['Black Panther', 'xjDjIWPYESU'],
  ['Black Panther', 'd96cgFxHxbA'],
  ['Black Panther', 'xjCvPH64fLw'],
  ['Black Panther', 'QtNKAJhN0GU'],
  ['La La Land', '0pdqf4P9M8A'],
  ['La La Land', '_LAAX6PmQKQ'],
  ['La La Land', 'TrzBPaZnJy0'],
  ['La La Land', '0e3GPea1Tyg'],
  ['Mad Max', 'hEJnMqG9d8o'],
  ['Mad Max', 'WLpn3oKXKpU'],
  ['Mad Max', 'hA2ple9q4sQN'],
  ['Mad Max', 'cdNlajbEY18'],
  ['Mad Max', 'YqNYrYUiMfg'],
  ['Social Network', 'lB95KL-mpL8'],
  ['Social Network', 'Lgb1X3DEgsE'],
  ['Social Network', 'uK7FWKeNKKA'],
  ['Social Network', '8ugaeA-nMTc'],
  ['Whiplash', '7d_jQycdQGo'],
  ['Whiplash', 'Q7kZy3T6vRM'],
  ['Whiplash', '7CLfAm8f8J8'],
  ['Knives Out', 'qGqiFjh2R7Y'],
  ['Knives Out', '2i_WTotBuHo'],
  ['Knives Out', 'pVi8R8KOjvM'],
  ['Knives Out', 'rB-63tE2Kfc'],
  ['Oppenheimer', 'uYPbbksJxIg'],
  ['Oppenheimer', 'uLtkt8BonwM'],
];

async function main() {
  for (const [movie, id] of ids) {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    const t = r.ok ? await r.json() : null;
    console.log(r.ok ? 'OK' : 'NO', movie.padEnd(18), id, t?.title?.slice(0, 55) || '');
    await new Promise((x) => setTimeout(x, 120));
  }
}
main();
