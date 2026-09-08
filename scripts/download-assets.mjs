import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filmDir = path.join(__dirname, '../apps/web/public/film');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const OMDB_KEY = 'thewdb';
const force = process.argv.includes('--force');
const MIN_GOOD_SIZE = 80000;

const allFilms = [
  { name: '01-inception.jpg', imdb: 'tt1375666' },
  { name: '02-dark-knight.jpg', imdb: 'tt0468569' },
  { name: '03-interstellar.jpg', imdb: 'tt0816692' },
  { name: '04-shawshank-redemption.jpg', imdb: 'tt0111161' },
  { name: '05-pulp-fiction.jpg', imdb: 'tt0110912' },
  { name: '06-godfather.jpg', imdb: 'tt0068646' },
  { name: '07-avatar.jpg', imdb: 'tt0499549' },
  { name: '08-titanic.jpg', imdb: 'tt0120338' },
  { name: '09-avengers-endgame.jpg', imdb: 'tt4154796' },
  { name: '10-spiderman-no-way-home.jpg', imdb: 'tt10872600' },
  { name: '11-joker.jpg', imdb: 'tt7286456' },
  { name: '12-parasite.jpg', imdb: 'tt6751668' },
  { name: '13-everything-everywhere.jpg', imdb: 'tt6710474' },
  { name: '14-oppenheimer.jpg', imdb: 'tt15398776' },
  { name: '15-dune.jpg', imdb: 'tt1160419' },
  { name: '16-top-gun-maverick.jpg', imdb: 'tt1745960' },
  { name: '17-black-panther.jpg', imdb: 'tt4116284' },
  { name: '18-matrix.jpg', imdb: 'tt0133093' },
  { name: '19-gladiator.jpg', imdb: 'tt0172495' },
  { name: '20-la-la-land.jpg', imdb: 'tt3783958' },
  { name: '21-get-out.jpg', imdb: 'tt5052448' },
  { name: '22-mad-max-fury-road.jpg', imdb: 'tt1392190' },
  { name: '23-social-network.jpg', imdb: 'tt1285016' },
  { name: '24-whiplash.jpg', imdb: 'tt2582802' },
  { name: '25-knives-out.jpg', imdb: 'tt8946378' },
  { name: '26-spider-verse.jpg', imdb: 'tt4633694' },
  { name: '27-lion-king.jpg', imdb: 'tt0110357' },
  { name: '28-finding-nemo.jpg', imdb: 'tt0266543' },
  { name: '29-toy-story.jpg', imdb: 'tt0114709' },
  { name: '30-frozen.jpg', imdb: 'tt2294629' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function posterCandidates(omdbUrl) {
  const candidates = new Set([omdbUrl]);
  const idMatch = omdbUrl.match(/\/M\/([^@]+)/);
  const imageId = idMatch?.[1];

  candidates.add(
    omdbUrl
      .replace(/UX\d+/g, 'UX1000')
      .replace(/SX\d+/g, 'SX1000')
      .replace(/SY\d+/g, 'SY1500')
      .replace(/CR0,\d+,\d+,\d+_/g, ''),
  );
  candidates.add(omdbUrl.replace(/_V1_.*$/, '_V1.jpg'));

  if (imageId) {
    candidates.add(`https://m.media-amazon.com/images/M/${imageId}.jpg`);
    candidates.add(`https://m.media-amazon.com/images/M/${imageId}._V1_SX1000.jpg`);
    candidates.add(`https://m.media-amazon.com/images/M/${imageId}._V1_SY1500.jpg`);
    candidates.add(`https://m.media-amazon.com/images/M/${imageId}@._V1_FMjpg_UX1000_.jpg`);
  }

  return [...candidates];
}

async function getOmdbPoster(imdbId) {
  const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`);
  const data = await res.json();
  if (data.Response !== 'True' || !data.Poster || data.Poster === 'N/A') {
    throw new Error(data.Error || 'No poster');
  }
  return data.Poster;
}

async function fetchImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) return null;
  return buf;
}

async function downloadBest(candidates) {
  let best = null;
  for (const url of candidates) {
    const buf = await fetchImage(url);
    if (buf && (!best || buf.length > best.length)) {
      best = { buf, url, length: buf.length };
    }
    await sleep(100);
  }
  if (!best) throw new Error('All poster URLs failed');
  return best;
}

async function main() {
  fs.mkdirSync(filmDir, { recursive: true });
  let ok = 0;

  for (const f of allFilms) {
    const dest = path.join(filmDir, f.name);
    const existingSize = fs.existsSync(dest) ? fs.statSync(dest).size : 0;

    if (!force && existingSize >= MIN_GOOD_SIZE) {
      console.log(`SKIP: ${f.name} (${existingSize} bytes)`);
      ok++;
      continue;
    }

    try {
      const omdbUrl = await getOmdbPoster(f.imdb);
      const candidates = posterCandidates(omdbUrl);
      const best = await downloadBest(candidates);

      if (!force && best.length <= existingSize) {
        console.log(`KEEP: ${f.name} (existing ${existingSize} >= ${best.length})`);
        ok++;
        continue;
      }

      fs.writeFileSync(dest, best.buf);
      console.log(`OK: ${f.name} (${best.length} bytes)`);
      ok++;
    } catch (e) {
      console.log(`FAIL: ${f.name} - ${e.message}`);
    }
    await sleep(350);
  }

  console.log(`\nDone: ${ok}/30 posters in public/film`);
}

main();
