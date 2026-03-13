/**
 * Seed script for Opening Theory & Repertoire category tree.
 * Imports the COMPLETE Lichess chess-openings dataset (CC0 Public Domain license)
 * from https://github.com/lichess-org/chess-openings
 *
 * This is the gold standard for chess opening names and move sequences.
 *
 * Usage: node scripts/seed-openings.js
 *   --force   Delete existing "Opening Theory" category and re-seed
 */
const mongoose = require('mongoose');
const https = require('https');

const LICHESS_BASE = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master';
const LETTERS = ['a', 'b', 'c', 'd', 'e'];
const LETTER_NAMES = {
  A: 'A Flank Openings',
  B: 'B Semi-Open Games',
  C: 'C Open Games',
  D: 'D Closed Games',
  E: 'E Indian Defences',
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseTsv(tsv) {
  const lines = tsv.trim().split('\n');
  // Skip header: eco\tname\tpgn
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 3) {
      entries.push({
        eco: parts[0].trim(),
        name: parts[1].trim(),
        pgn: parts[2].trim(),
      });
    }
  }
  return entries;
}

/**
 * Build a nested category tree from a flat list of openings.
 * Groups openings by ECO "family" (e.g., all B20 variations under a B20 parent).
 *
 * Structure:
 *   Letter (e.g., "B Semi-Open Games")
 *     └── ECO Group (e.g., "B20 Sicilian Defense") — the shortest-pgn entry
 *           └── Variation (e.g., "B20 Sicilian Defense: Snyder Variation")
 */
function buildLetterTree(entries) {
  // Group by ECO code prefix (e.g., "B20")
  const ecoGroups = new Map();
  for (const entry of entries) {
    const eco = entry.eco;
    if (!ecoGroups.has(eco)) {
      ecoGroups.set(eco, []);
    }
    ecoGroups.get(eco).push(entry);
  }

  const children = [];
  for (const [eco, group] of ecoGroups) {
    // Sort by pgn length — shortest is the "main" opening
    group.sort((a, b) => a.pgn.length - b.pgn.length);

    // Find the "main" entry — one without a colon (variation separator), or shortest
    let mainIdx = group.findIndex((e) => !e.name.includes(':'));
    if (mainIdx === -1) mainIdx = 0;
    const main = group[mainIdx];

    const variations = [];
    for (let i = 0; i < group.length; i++) {
      if (i === mainIdx) continue;
      variations.push({
        _id: new mongoose.Types.ObjectId().toString(),
        name: group[i].name,
        eco: group[i].eco,
        pgn: group[i].pgn,
        isActive: true,
        children: [],
      });
    }

    children.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: main.name,
      eco: main.eco,
      pgn: main.pgn,
      isActive: true,
      children: variations,
    });
  }

  // Sort by ECO code
  children.sort((a, b) => a.eco.localeCompare(b.eco));
  return children;
}

async function seed() {
  const forceMode = process.argv.includes('--force');

  await mongoose.connect('mongodb://localhost:27017/mdr-categories');
  const db = mongoose.connection.db;
  const coll = db.collection('categories');

  // Check if already exists
  const existing = await coll.findOne({ name: /opening theory/i });
  if (existing && !forceMode) {
    console.log('Opening Theory category already exists. Use --force to replace it.');
    await mongoose.disconnect();
    return;
  }
  if (existing && forceMode) {
    await coll.deleteOne({ _id: existing._id });
    console.log('Deleted existing Opening Theory category.');
  }

  // Download all 5 TSV files from Lichess
  console.log('Downloading Lichess chess-openings dataset (CC0 Public Domain)...');
  const allEntries = {};
  let totalCount = 0;

  for (const letter of LETTERS) {
    const url = `${LICHESS_BASE}/${letter}.tsv`;
    const tsv = await fetch(url);
    const entries = parseTsv(tsv);
    allEntries[letter.toUpperCase()] = entries;
    totalCount += entries.length;
    console.log(`  ${letter.toUpperCase()}: ${entries.length} openings downloaded`);
  }

  console.log(`Total: ${totalCount} openings from Lichess`);
  console.log('Building category tree...');

  // Build the tree
  const letterChildren = LETTERS.map((letter) => {
    const L = letter.toUpperCase();
    return {
      _id: new mongoose.Types.ObjectId().toString(),
      name: LETTER_NAMES[L],
      isActive: true,
      children: buildLetterTree(allEntries[L]),
    };
  });

  // Count total (including variations nested inside ECO groups)
  function countAll(nodes) {
    let count = 0;
    for (const n of nodes) {
      if (n.pgn) count++;
      if (n.children) count += countAll(n.children);
    }
    return count;
  }

  const rootDoc = {
    name: 'Opening Theory & Repertoire',
    isActive: true,
    children: letterChildren,
    source: 'lichess-org/chess-openings (CC0 Public Domain)',
    sourceUrl: 'https://github.com/lichess-org/chess-openings',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await coll.insertOne(rootDoc);

  const seededCount = countAll(letterChildren);
  console.log(`\nSeeded "Opening Theory & Repertoire" with ${seededCount} openings across 5 ECO categories.`);
  console.log('Letter breakdown:');
  for (const letter of LETTERS) {
    const L = letter.toUpperCase();
    const count = countAll(
      letterChildren.find((c) => c.name === LETTER_NAMES[L]).children,
    );
    console.log(`  ${L} (${LETTER_NAMES[L]}): ${count} openings`);
  }
  console.log(`\nSource: lichess-org/chess-openings (CC0 Public Domain)`);

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
