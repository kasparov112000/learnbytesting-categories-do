/**
 * Seed script for Chess subcategories.
 * Adds Tactics, Strategy, Endgames, Checkmate Patterns, Calculation, and Famous Games
 * as siblings of "Opening Theory & Repertoire" under the Chess root category.
 *
 * Tactics subcategories are sourced from Lichess puzzle themes (CC0 Public Domain).
 * https://github.com/lichess-org/lila/blob/master/translation/source/puzzleTheme.xml
 *
 * Usage: node scripts/seed-chess-categories.js
 *   --force   Replace existing subcategories if they already exist
 */
const mongoose = require('mongoose');

const CHESS_CATEGORY_ID = 'bc7a15ff-a235-468a-ac0c-4abe215e9435';

function id() {
  return new mongoose.Types.ObjectId().toString();
}

function cat(name, children = [], extra = {}) {
  return {
    _id: id(),
    name,
    isActive: true,
    children: children.map(c => ({ ...c, isActive: c.isActive !== undefined ? c.isActive : true })),
    ...extra,
  };
}

function leaf(name, extra = {}) {
  return { _id: id(), name, isActive: true, children: [], ...extra };
}

// ─── TACTICS (sourced from Lichess puzzle themes, CC0) ───

const TACTICS = cat('Tactics', [
  cat('Basic Tactics', [
    leaf('Fork', { description: 'A move where the moved piece attacks two opponent pieces at once.' }),
    leaf('Pin', { description: 'A piece is unable to move without revealing an attack on a higher value piece.' }),
    leaf('Skewer', { description: 'A high value piece being attacked moves out of the way, allowing a lower value piece behind it to be captured.' }),
    leaf('Discovered Attack', { description: 'Moving a piece that previously blocked an attack by a long range piece, out of the way.' }),
    leaf('Discovered Check', { description: 'Move a piece to reveal a check from a hidden attacking piece.' }),
    leaf('Double Check', { description: 'Checking with two pieces at once, as a result of a discovered attack.' }),
    leaf('Hanging Piece', { description: 'An opponent piece being undefended or insufficiently defended and free to capture.' }),
    leaf('Trapped Piece', { description: 'A piece unable to escape capture as it has limited moves.' }),
    leaf('En Passant', { description: 'A tactic involving the en passant rule.' }),
  ]),
  cat('Intermediate Tactics', [
    leaf('Deflection', { description: 'A move that distracts an opponent piece from another duty.' }),
    leaf('Attraction', { description: 'An exchange or sacrifice encouraging an opponent piece to a square that allows a follow-up tactic.' }),
    leaf('Interference', { description: 'Moving a piece between two opponent pieces to leave one or both undefended.' }),
    leaf('Intermezzo (Zwischenzug)', { description: 'Instead of the expected move, first interpose another move posing an immediate threat.' }),
    leaf('X-Ray Attack', { description: 'A piece attacks or defends a square through an enemy piece.' }),
    leaf('Capture the Defender', { description: 'Removing a piece critical to defence of another piece.' }),
    leaf('Sacrifice', { description: 'Giving up material in the short-term to gain an advantage after a forced sequence of moves.' }),
    leaf('Quiet Move', { description: 'A move that does not make a check or capture, nor an immediate threat.' }),
    leaf('Zugzwang', { description: 'The opponent is limited in moves and all moves worsen their position.' }),
  ]),
  cat('Advanced Tactics', [
    leaf('Promotion', { description: 'Promote one of your pawns to a queen or minor piece.' }),
    leaf('Underpromotion', { description: 'Promotion to a knight, bishop, or rook instead of a queen.' }),
    leaf('Advanced Pawn', { description: 'A pawn deep into the opponent position, threatening to promote.' }),
    leaf('Defensive Move', { description: 'A precise move needed to avoid losing material or another advantage.' }),
    leaf('Kingside Attack', { description: 'An attack of the opponent king after kingside castling.' }),
    leaf('Queenside Attack', { description: 'An attack of the opponent king after queenside castling.' }),
    leaf('Attacking f2/f7', { description: 'An attack focusing on the f2 or f7 pawn.' }),
    leaf('Exposed King', { description: 'A tactic involving a king with few defenders, often leading to checkmate.' }),
    leaf('Collinear Move', { description: 'Two opposing pieces face each other and one slides along the line without capturing.' }),
  ]),
  cat('By Difficulty', [
    leaf('Mate in 1', { description: 'Deliver checkmate in one move.' }),
    leaf('Mate in 2', { description: 'Deliver checkmate in two moves.' }),
    leaf('Mate in 3', { description: 'Deliver checkmate in three moves.' }),
    leaf('Mate in 4', { description: 'Deliver checkmate in four moves.' }),
    leaf('Mate in 5 or More', { description: 'Figure out a long mating sequence.' }),
    leaf('One-Move Puzzle', { description: 'A puzzle that is only one move long.' }),
    leaf('Short Puzzle (2 moves)', { description: 'Two moves to win.' }),
    leaf('Long Puzzle (3 moves)', { description: 'Three moves to win.' }),
    leaf('Very Long Puzzle (4+ moves)', { description: 'Four moves or more to win.' }),
  ]),
], {
  description: 'Pattern recognition puzzles — the single most effective way to improve at chess.',
  source: 'Themes from lichess.org/training (CC0 Public Domain)',
});

// ─── STRATEGY ───

const STRATEGY = cat('Strategy', [
  cat('Pawn Structure', [
    leaf('Isolated Pawns', { description: 'Understanding and exploiting isolated pawns.' }),
    leaf('Doubled Pawns', { description: 'When two pawns of the same color are on the same file.' }),
    leaf('Backward Pawns', { description: 'A pawn that cannot be protected by other pawns and is a potential weakness.' }),
    leaf('Passed Pawns', { description: 'A pawn with no opposing pawns to prevent it from advancing to promotion.' }),
    leaf('Pawn Chains', { description: 'Diagonal pawn structures and how to attack them at the base.' }),
    leaf('Pawn Majority', { description: 'Using a numerical pawn advantage on one side of the board.' }),
    leaf('Pawn Islands', { description: 'Groups of connected pawns separated by open files.' }),
    leaf('Pawn Breaks', { description: 'Advancing a pawn to open lines and create imbalances.' }),
  ]),
  cat('Piece Activity', [
    leaf('Good vs Bad Bishop', { description: 'When a bishop is blocked by its own pawns vs when it has open diagonals.' }),
    leaf('Bishop Pair Advantage', { description: 'The strategic advantage of having two bishops in open positions.' }),
    leaf('Knight Outposts', { description: 'Placing knights on strong squares that cannot be attacked by enemy pawns.' }),
    leaf('Rook on Open Files', { description: 'Placing rooks on files with no pawns for maximum activity.' }),
    leaf('Rook on the 7th Rank', { description: 'Rooks penetrating to the 7th rank to attack pawns and restrict the king.' }),
    leaf('Piece Coordination', { description: 'How pieces work together to create threats.' }),
    leaf('Centralization', { description: 'Placing pieces in the center for maximum influence.' }),
    leaf('Minor Piece Exchanges', { description: 'When to exchange bishops for knights and vice versa.' }),
  ]),
  cat('Positional Concepts', [
    leaf('Weak Squares', { description: 'Squares that cannot be defended by pawns and become targets.' }),
    leaf('Space Advantage', { description: 'Controlling more territory on the board.' }),
    leaf('Open and Closed Positions', { description: 'How pawn structure determines piece activity and plans.' }),
    leaf('Prophylaxis', { description: 'Preventing the opponent\'s plans before they are executed.' }),
    leaf('Overprotection', { description: 'Nimzowitsch\'s concept of defending key squares with multiple pieces.' }),
    leaf('Blockade', { description: 'Placing a piece in front of a passed pawn to stop its advance.' }),
    leaf('Restriction', { description: 'Limiting the opponent\'s piece mobility and options.' }),
    leaf('Color Complex Weakness', { description: 'When one color of squares becomes chronically weak.' }),
  ]),
  cat('Planning', [
    leaf('Minority Attack', { description: 'Advancing pawns on the side where you have fewer to create weaknesses.' }),
    leaf('Kingside Attack Strategy', { description: 'When and how to launch a pawn storm against the castled king.' }),
    leaf('Piece Redeployment', { description: 'Improving a poorly placed piece by maneuvering it to a better square.' }),
    leaf('Exchanging Pieces', { description: 'When trading pieces is strategically advantageous.' }),
    leaf('Two Weaknesses Principle', { description: 'Creating and exploiting two weaknesses simultaneously.' }),
    leaf('Converting an Advantage', { description: 'Turning a positional or material advantage into a win.' }),
  ]),
], {
  description: 'Positional understanding — long-term planning, pawn structures, and piece placement.',
});

// ─── ENDGAMES ───

const ENDGAMES = cat('Endgames', [
  cat('Pawn Endgames', [
    leaf('King and Pawn vs King', { description: 'The most fundamental endgame. Opposition and the square rule.' }),
    leaf('Opposition', { description: 'Direct, distant, and diagonal opposition concepts.' }),
    leaf('Triangulation', { description: 'Losing a tempo to put the opponent in zugzwang.' }),
    leaf('Pawn Races', { description: 'When both sides have passed pawns racing to promote.' }),
    leaf('Key Squares', { description: 'The critical squares that determine if a pawn can promote.' }),
    leaf('The Square Rule', { description: 'Whether a king can catch a passed pawn.' }),
    leaf('Protected Passed Pawn', { description: 'A passed pawn defended by another pawn.' }),
    leaf('Outside Passed Pawn', { description: 'Using a distant passed pawn to decoy the opponent king.' }),
    leaf('Breakthrough', { description: 'Sacrificing pawns to create an unstoppable passed pawn.' }),
  ]),
  cat('Rook Endgames', [
    leaf('Lucena Position', { description: 'The most important winning position with rook and pawn vs rook.' }),
    leaf('Philidor Position', { description: 'The key defensive technique: keep the rook on the third rank.' }),
    leaf('Rook Behind Passed Pawn', { description: 'Tarrasch\'s rule: place the rook behind passed pawns.' }),
    leaf('Rook vs Pawn', { description: 'When a rook can stop a pawn from promoting.' }),
    leaf('Rook and Pawn vs Rook', { description: 'Winning and drawing techniques in this common endgame.' }),
    leaf('Active King in Rook Endgames', { description: 'The king must be active in rook endgames.' }),
    leaf('Cutting Off the King', { description: 'Using the rook to restrict the opponent king along a rank or file.' }),
  ]),
  cat('Minor Piece Endgames', [
    leaf('Bishop vs Knight', { description: 'When each piece is better depending on the pawn structure.' }),
    leaf('Same-Color Bishop Endgames', { description: 'Techniques with bishops on the same color diagonal.' }),
    leaf('Opposite-Color Bishop Endgames', { description: 'Drawing tendencies and winning techniques.' }),
    leaf('Knight Endgames', { description: 'Knight endgames are like pawn endgames — king activity is crucial.' }),
    leaf('Two Bishops vs Knight', { description: 'The bishop pair advantage in endgames.' }),
    leaf('Bishop and Pawn vs King', { description: 'Wrong bishop/wrong rook pawn drawing concepts.' }),
  ]),
  cat('Queen Endgames', [
    leaf('Queen vs Pawn on 7th', { description: 'How the queen stops a pawn about to promote.' }),
    leaf('Queen vs Rook', { description: 'Winning technique using Philidor\'s third-rank defense in reverse.' }),
    leaf('Queen and Pawn Endgames', { description: 'Techniques in queen endgames with multiple pawns.' }),
  ]),
  cat('Theoretical Endgames', [
    leaf('Insufficient Material', { description: 'Positions that are drawn due to insufficient mating material.' }),
    leaf('Stalemate Patterns', { description: 'Recognizing and using/avoiding stalemate.' }),
    leaf('Fortress', { description: 'A defensive setup that prevents the opponent from making progress.' }),
    leaf('50-Move Rule', { description: 'Understanding when draws can be claimed.' }),
    leaf('Tablebase Positions', { description: 'Endgame positions solved by computer databases.' }),
  ]),
], {
  description: 'Technique and theoretical positions — converting advantages and saving drawn positions.',
});

// ─── CHECKMATE PATTERNS ───

const CHECKMATE_PATTERNS = cat('Checkmate Patterns', [
  cat('Back Rank Mates', [
    leaf('Back Rank Mate', { description: 'Checkmate the king on the home rank when it is trapped by its own pieces.' }),
    leaf('Opera Mate', { description: 'A rook delivers checkmate supported by a bishop.' }),
    leaf('Kill Box Mate', { description: 'A rook is next to the king, supported by a queen that blocks escape squares.' }),
    leaf('Pillsbury\'s Mate', { description: 'The rook delivers checkmate while the bishop helps confine the king.' }),
    leaf('Blind Swine Mate', { description: 'Two rooks team up to mate the king in an area of 2×2 squares.' }),
  ]),
  cat('Knight Mates', [
    leaf('Smothered Mate', { description: 'A knight checkmates a king surrounded by its own pieces.' }),
    leaf('Arabian Mate', { description: 'A knight and rook team up to trap the king on a corner.' }),
    leaf('Hook Mate', { description: 'Checkmate with a rook, knight, and pawn along with one enemy pawn.' }),
    leaf('Corner Mate', { description: 'Confine the king to the corner using a rook or queen and a knight.' }),
    leaf('Vukovic Mate', { description: 'A rook and knight team up with a third piece\'s support.' }),
  ]),
  cat('Bishop Mates', [
    leaf('Boden\'s Mate', { description: 'Two bishops on criss-crossing diagonals deliver mate to an obstructed king.' }),
    leaf('Double Bishop Mate', { description: 'Two bishops on adjacent diagonals deliver mate.' }),
    leaf('Morphy\'s Mate', { description: 'Use the bishop to check the king while your rook confines it.' }),
    leaf('Balestra Mate', { description: 'A bishop delivers checkmate while a queen blocks escape squares.' }),
  ]),
  cat('Queen Mates', [
    leaf('Dovetail Mate (Cozio\'s)', { description: 'A queen delivers mate to an adjacent king whose escape squares are obstructed.' }),
    leaf('Swallow\'s Tail Mate (Guéridon)', { description: 'A checkmate pattern resembling a V shape.' }),
    leaf('Epaulette Mate', { description: 'Two adjacent escape squares for a checked king are occupied by other pieces.' }),
    leaf('Anastasia\'s Mate', { description: 'A knight and queen/rook trap the king between the side of the board and a friendly piece.' }),
    leaf('Triangle Mate', { description: 'The queen and rook, one square from the king, are on the same rank or file.' }),
  ]),
  cat('Basic Checkmates', [
    leaf('Queen Mate (K+Q vs K)', { description: 'Delivering checkmate with king and queen against a lone king.' }),
    leaf('Rook Mate (K+R vs K)', { description: 'Delivering checkmate with king and rook — the "staircase" technique.' }),
    leaf('Two Rook Mate', { description: 'The "lawnmower" or "staircase" mate with two rooks.' }),
    leaf('Two Bishop Mate (K+2B vs K)', { description: 'Driving the king to the corner with two bishops.' }),
    leaf('Bishop and Knight Mate (K+B+N vs K)', { description: 'The most difficult basic checkmate — driving the king to the correct corner.' }),
  ]),
], {
  description: 'Recognizable mating patterns — the building blocks of combinative play.',
  source: 'Patterns from lichess.org puzzle themes (CC0 Public Domain)',
});

// ─── CALCULATION ───

const CALCULATION = cat('Calculation', [
  cat('Visualization', [
    leaf('Board Visualization', { description: 'Seeing the board and piece positions in your mind.' }),
    leaf('Move Sequences', { description: 'Following a sequence of moves mentally without moving pieces.' }),
    leaf('Blindfold Exercises', { description: 'Playing or solving positions without seeing the board.' }),
    leaf('Color Complex Awareness', { description: 'Recognizing which color squares pieces control.' }),
  ]),
  cat('Calculation Techniques', [
    leaf('Candidate Moves', { description: 'Identifying the most promising moves to calculate.' }),
    leaf('Forcing Moves First', { description: 'Always consider checks, captures, and threats before quiet moves.' }),
    leaf('Elimination', { description: 'Ruling out moves that don\'t work to narrow down the best move.' }),
    leaf('Comparison Method', { description: 'Comparing two candidate moves by analyzing their consequences.' }),
    leaf('Tree of Variations', { description: 'Systematically calculating branching move sequences.' }),
  ]),
  cat('Pattern Recognition', [
    leaf('Common Sacrifices', { description: 'Recognizing recurring sacrifice patterns (Bxh7+, Nxf7, etc.).' }),
    leaf('Geometric Motifs', { description: 'Recognizing diagonal, file, and rank alignment patterns.' }),
    leaf('Piece Configurations', { description: 'Recognizing when piece placements signal tactical opportunities.' }),
    leaf('Counting', { description: 'Accurately counting attackers vs defenders on a square.' }),
  ]),
], {
  description: 'Multi-move visualization and systematic thinking — the engine of tactical execution.',
});

// ─── FAMOUS GAMES ───

const FAMOUS_GAMES = cat('Famous Games', [
  cat('Romantic Era (1800s)', [
    leaf('Immortal Game (Anderssen vs Kieseritzky, 1851)', { description: 'Adolf Anderssen sacrificed both rooks and a bishop for a brilliant king hunt.' }),
    leaf('Evergreen Game (Anderssen vs Dufresne, 1852)', { description: 'A stunning combination involving multiple sacrifices and discovered attacks.' }),
    leaf('Opera Game (Morphy vs Duke & Count, 1858)', { description: 'Paul Morphy\'s masterpiece of rapid development and open lines.' }),
    leaf('Game of the Century (Fischer vs Byrne, 1956)', { description: '13-year-old Bobby Fischer\'s stunning queen sacrifice against a master.' }),
  ]),
  cat('Classical Era', [
    leaf('Capablanca vs Marshall, 1918', { description: 'Capablanca defends against the Marshall Attack in its debut.' }),
    leaf('Alekhine vs Réti, 1925', { description: 'A brilliant combination from the first World Champion of the hypermodern school.' }),
    leaf('Botvinnik vs Capablanca, 1938', { description: 'Botvinnik\'s deep strategic masterpiece at AVRO.' }),
    leaf('Tal vs Botvinnik, 1960 Game 6', { description: 'Mikhail Tal\'s wild sacrificial style against the methodical Botvinnik.' }),
  ]),
  cat('Modern Era', [
    leaf('Fischer vs Spassky, 1972 Game 6', { description: 'Fischer\'s greatest game — a Queen\'s Gambit Declined masterpiece.' }),
    leaf('Kasparov vs Topalov, 1999', { description: 'Kasparov\'s "Immortal" — a stunning rook sacrifice and king hunt.' }),
    leaf('Kasparov vs Karpov, 1985 Game 16', { description: 'The pivotal game of the longest World Championship match.' }),
    leaf('Kramnik vs Kasparov, 2000 Game 2', { description: 'The Berlin Wall — Kramnik\'s revolutionary opening choice to dethrone Kasparov.' }),
  ]),
  cat('Contemporary Classics', [
    leaf('Anand vs Aronian, 2013', { description: 'A brilliant attack showcasing Anand\'s tactical genius.' }),
    leaf('Carlsen vs Anand, 2013 Game 9', { description: 'Magnus Carlsen clinches his first World Championship title.' }),
    leaf('Caruana vs Carlsen, 2018', { description: 'The drawn classical match that showcased top-level preparation.' }),
    leaf('Ding vs Nepomniachtchi, 2023 Game 12', { description: 'The dramatic tiebreak game deciding the first post-Carlsen champion.' }),
  ]),
  cat('Themes in Masterpieces', [
    leaf('King Hunts', { description: 'Famous games where the king was chased across the board.' }),
    leaf('Positional Sacrifices', { description: 'Games featuring long-term material sacrifice for positional compensation.' }),
    leaf('Brilliant Defenses', { description: 'Famous games won from seemingly lost positions.' }),
    leaf('Endgame Masterpieces', { description: 'Games decided by brilliant endgame technique.' }),
    leaf('Opening Novelties', { description: 'Games where a new move changed opening theory.' }),
  ]),
], {
  description: 'Annotated masterpieces — learn from the greatest games ever played.',
});

// ─── ALL NEW CATEGORIES ───

const NEW_CATEGORIES = [TACTICS, STRATEGY, ENDGAMES, CHECKMATE_PATTERNS, CALCULATION, FAMOUS_GAMES];

async function seed() {
  const forceMode = process.argv.includes('--force');

  await mongoose.connect('mongodb://localhost:27017/mdr-categories');
  const db = mongoose.connection.db;
  const coll = db.collection('categories');

  // Find Chess root
  const chess = await coll.findOne({ _id: CHESS_CATEGORY_ID });
  if (!chess) {
    console.error('Chess category not found (expected _id: ' + CHESS_CATEGORY_ID + ')');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('Found Chess root category:', chess.name);
  const existingChildren = chess.children || [];
  console.log('Existing children:', existingChildren.map(c => c.name).join(', '));

  const newChildren = [...existingChildren];
  let addedCount = 0;
  let skippedCount = 0;

  for (const cat of NEW_CATEGORIES) {
    const existingIdx = newChildren.findIndex(c => c.name === cat.name);
    if (existingIdx >= 0) {
      if (forceMode) {
        newChildren[existingIdx] = cat;
        console.log('  Replaced: ' + cat.name);
        addedCount++;
      } else {
        console.log('  Skipped (already exists): ' + cat.name + ' — use --force to replace');
        skippedCount++;
      }
    } else {
      newChildren.push(cat);
      console.log('  Added: ' + cat.name);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    console.log('\nNo changes made.');
    await mongoose.disconnect();
    return;
  }

  await coll.updateOne(
    { _id: CHESS_CATEGORY_ID },
    { $set: { children: newChildren, modifiedDate: new Date() } },
  );

  // Count all descendants
  function countAll(nodes) {
    let count = 0;
    for (const n of nodes) {
      count++;
      if (n.children) count += countAll(n.children);
    }
    return count;
  }

  console.log('\n=== Chess Category Structure ===');
  for (const child of newChildren) {
    const total = countAll(child.children || []);
    console.log('  ' + child.name + ': ' + total + ' subcategories/topics');
  }
  console.log('\nTotal: ' + addedCount + ' categories added, ' + skippedCount + ' skipped');

  await mongoose.disconnect();
}

seed().catch(e => {
  console.error('Seed failed:', e);
  process.exit(1);
});
