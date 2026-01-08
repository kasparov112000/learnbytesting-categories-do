/**
 * Seed script for initial chess opening traps
 * Run with: npx ts-node scripts/seed-traps.ts
 */

import * as mongoose from 'mongoose';
import { TrapModel, ITrap } from '../app/models/trap.model';

// MongoDB connection string - adjust for your environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mdr-categories';

const initialTraps: Partial<ITrap>[] = [
  // ==================== RUY LOPEZ TRAPS ====================
  {
    name: "Fishing Pole Trap",
    description: "A dangerous trap in the Ruy Lopez Berlin Defense where Black sacrifices the knight to expose White's king.",
    setupFen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    triggerMove: "O-O",
    triggerFen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4",
    refutationMoves: [
      { move: "Ng4", fen: "r1bqkb1r/pppp1ppp/2n5/1B2p3/4P1n1/5N2/PPPP1PPP/RNBQ1RK1 w kq - 6 5", annotation: "Attacking h2" },
      { move: "h3", fen: "r1bqkb1r/pppp1ppp/2n5/1B2p3/4P1n1/5N1P/PPPP1PP1/RNBQ1RK1 b kq - 0 5", annotation: "Trying to push the knight away" },
      { move: "h5", fen: "r1bqkb1r/pppp1pp1/2n5/1B2p2p/4P1n1/5N1P/PPPP1PP1/RNBQ1RK1 w kq h6 0 6", annotation: "The fishing pole! Knight can't be taken" }
    ],
    benefitsColor: "black",
    eco: "C65",
    openingName: "Ruy Lopez",
    variationName: "Berlin Defense",
    explanation: "After O-O, Black plays Ng4 threatening h2. If White plays h3, Black responds with h5! The knight cannot be captured because hxg4 hxg4 opens the h-file for a devastating attack on the exposed king.",
    keyIdea: "The h-pawn becomes a 'fishing pole' to hook the white king",
    commonMistake: "White often castles without seeing the Ng4-h5 idea",
    difficulty: "intermediate",
    trapType: "mating",
    frequency: "occasional",
    tags: ["ruy lopez", "berlin", "kingside attack", "sacrifice"]
  },
  {
    name: "Noah's Ark Trap",
    description: "A classic trap where White's bishop gets trapped on b3 by Black's pawns.",
    setupFen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    triggerMove: "Ba4",
    triggerFen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 4",
    refutationMoves: [
      { move: "b5", fen: "r1bqkbnr/2pp1ppp/p1n5/1p2p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq b6 0 5" },
      { move: "Bb3", fen: "r1bqkbnr/2pp1ppp/p1n5/1p2p3/4P3/1B3N2/PPPP1PPP/RNBQK2R b KQkq - 1 5" },
      { move: "c5", fen: "r1bqkbnr/3p1ppp/p1n5/1pp1p3/4P3/1B3N2/PPPP1PPP/RNBQK2R w KQkq c6 0 6" },
      { move: "c3", fen: "r1bqkbnr/3p1ppp/p1n5/1pp1p3/4P3/1BP2N2/PP1P1PPP/RNBQK2R b KQkq - 0 6" },
      { move: "c4", fen: "r1bqkbnr/3p1ppp/p1n5/1p2p3/2p1P3/1BP2N2/PP1P1PPP/RNBQK2R w KQkq - 0 7", annotation: "Bishop trapped!" }
    ],
    benefitsColor: "black",
    eco: "C70",
    openingName: "Ruy Lopez",
    variationName: "Morphy Defense",
    explanation: "After a6 and b5, the bishop retreats to b3. Black continues with c5 and c4, trapping the bishop in a pawn prison resembling Noah's Ark.",
    keyIdea: "Pawns march forward to trap the bishop like animals in Noah's Ark",
    commonMistake: "White plays Ba4 instead of Bb3 after a6",
    difficulty: "beginner",
    trapType: "material",
    frequency: "common",
    tags: ["ruy lopez", "morphy defense", "bishop trap", "pawn chain"]
  },

  // ==================== ITALIAN GAME TRAPS ====================
  {
    name: "Legal's Mate Trap",
    description: "One of the oldest and most famous chess traps, sacrificing the queen for a beautiful checkmate.",
    setupFen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    triggerMove: "d6",
    triggerFen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    refutationMoves: [
      { move: "Nc3", fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 1 4" },
      { move: "Bg4", fen: "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 2 5", annotation: "Pinning the knight" },
      { move: "Nxe5", fen: "r2qkbnr/ppp2ppp/2np4/4N3/2B1P1b1/2N5/PPPP1PPP/R1BQK2R b KQkq - 0 5", annotation: "Sacrifice begins!" },
      { move: "Bxd1", fen: "r2qkbnr/ppp2ppp/2np4/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6", annotation: "Black takes the queen" },
      { move: "Bxf7+", fen: "r2qkbnr/ppp2Bpp/2np4/4N3/4P3/2N5/PPPP1PPP/R1BbK2R b KQkq - 0 6", annotation: "Check!" },
      { move: "Ke7", fen: "r2q1bnr/ppp1kBpp/2np4/4N3/4P3/2N5/PPPP1PPP/R1BbK2R w KQ - 1 7" },
      { move: "Nd5#", fen: "r2q1bnr/ppp1kBpp/2np4/3NN3/4P3/8/PPPP1PPP/R1BbK2R b KQ - 2 7", annotation: "Checkmate!" }
    ],
    benefitsColor: "white",
    eco: "C50",
    openingName: "Italian Game",
    variationName: "Legal's Mate",
    explanation: "After Black pins the knight with Bg4, White sacrifices the queen with Nxe5! If Black takes the queen, Bxf7+ Ke7 Nd5# is checkmate. The three minor pieces coordinate beautifully.",
    keyIdea: "Queen sacrifice leads to smothered mate pattern",
    commonMistake: "Black captures the queen without seeing the mate",
    difficulty: "beginner",
    trapType: "mating",
    frequency: "occasional",
    tags: ["italian game", "queen sacrifice", "smothered mate", "classic"]
  },
  {
    name: "Blackburne Shilling Gambit",
    description: "A dubious but trappy gambit that punishes greedy players who capture the e5 pawn.",
    setupFen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    triggerMove: "Nd4",
    triggerFen: "r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    refutationMoves: [
      { move: "Nxe5", fen: "r1bqkbnr/pppp1ppp/8/4N3/2BnP3/8/PPPP1PPP/RNBQK2R b KQkq - 0 4", annotation: "The trap is set!" },
      { move: "Qg5", fen: "r1b1kbnr/pppp1ppp/8/4N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 5", annotation: "Attacking Nxf7 and g2" },
      { move: "Nxf7", fen: "r1b1kbnr/pppp1Npp/8/6q1/2BnP3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5" },
      { move: "Qxg2", fen: "r1b1kbnr/pppp1Npp/8/8/2BnP3/8/PPPP1PqP/RNBQK2R w KQkq - 0 6", annotation: "Threatening Qxh1+ and Nf3#" },
      { move: "Rf1", fen: "r1b1kbnr/pppp1Npp/8/8/2BnP3/8/PPPP1PqP/RNBQKR2 b Qkq - 1 6" },
      { move: "Qxe4+", fen: "r1b1kbnr/pppp1Npp/8/8/2Bnq3/8/PPPP1P1P/RNBQKR2 w Qkq - 0 7", annotation: "Winning material" }
    ],
    benefitsColor: "black",
    eco: "C50",
    openingName: "Italian Game",
    variationName: "Blackburne Shilling Gambit",
    explanation: "After Nd4!?, if White greedily takes Nxe5, Black plays Qg5! attacking both g2 and threatening Qxg2 followed by Qxh1+ and Nf3#. White's best response is to decline with Nxd4.",
    keyIdea: "Sacrifice a pawn to win the rook or deliver mate",
    commonMistake: "White takes Nxe5 without seeing Qg5",
    difficulty: "beginner",
    trapType: "material",
    frequency: "occasional",
    tags: ["italian game", "gambit", "queen attack", "trap"]
  },

  // ==================== QUEEN'S GAMBIT TRAPS ====================
  {
    name: "Lasker Trap",
    description: "A famous trap in the Queen's Gambit Accepted where Black wins material through a brilliant combination.",
    setupFen: "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    triggerMove: "e3",
    triggerFen: "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/4P3/PP3PPP/RNBQKBNR b KQkq - 0 3",
    refutationMoves: [
      { move: "dxc4", fen: "rnbqkbnr/ppp2ppp/4p3/8/2pP4/4P3/PP3PPP/RNBQKBNR w KQkq - 0 4" },
      { move: "Bxc4", fen: "rnbqkbnr/ppp2ppp/4p3/8/2BP4/4P3/PP3PPP/RNBQK1NR b KQkq - 0 4" },
      { move: "Nf6", fen: "rnbqkb1r/ppp2ppp/4pn2/8/2BP4/4P3/PP3PPP/RNBQK1NR w KQkq - 1 5" },
      { move: "Nc3", fen: "rnbqkb1r/ppp2ppp/4pn2/8/2BP4/2N1P3/PP3PPP/R1BQK1NR b KQkq - 2 5" },
      { move: "Nc6", fen: "r1bqkb1r/ppp2ppp/2n1pn2/8/2BP4/2N1P3/PP3PPP/R1BQK1NR w KQkq - 3 6" },
      { move: "Nf3", fen: "r1bqkb1r/ppp2ppp/2n1pn2/8/2BP4/2N1PN2/PP3PPP/R1BQK2R b KQkq - 4 6" },
      { move: "Bb4", fen: "r1bqk2r/ppp2ppp/2n1pn2/8/1bBP4/2N1PN2/PP3PPP/R1BQK2R w KQkq - 5 7" },
      { move: "O-O", fen: "r1bqk2r/ppp2ppp/2n1pn2/8/1bBP4/2N1PN2/PP3PPP/R1BQ1RK1 b kq - 6 7" },
      { move: "Nxe4", fen: "r1bqk2r/ppp2ppp/2n1p3/8/1bBPn3/2N1PN2/PP3PPP/R1BQ1RK1 w kq - 0 8", annotation: "The trap begins!" }
    ],
    benefitsColor: "black",
    eco: "D21",
    openingName: "Queen's Gambit Accepted",
    variationName: "Lasker Trap",
    explanation: "After the sequence of developing moves, Black plays Nxe4! If White takes Nxe4, Bxc3 wins a piece because the pawn on b2 is pinned. This trap is named after World Champion Emanuel Lasker.",
    keyIdea: "Knight sacrifice exploits the pinned b2 pawn",
    commonMistake: "White captures Nxe4 without seeing Bxc3",
    difficulty: "intermediate",
    trapType: "material",
    frequency: "occasional",
    tags: ["queen's gambit", "accepted", "pin", "lasker"]
  },
  {
    name: "Elephant Trap",
    description: "A deadly trap in the Queen's Gambit Declined where Black wins White's queen.",
    setupFen: "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    triggerMove: "Bg5",
    triggerFen: "rnbqkb1r/ppp2ppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR b KQkq - 3 4",
    refutationMoves: [
      { move: "Nbd7", fen: "r1bqkb1r/pppn1ppp/4pn2/3p2B1/2PP4/2N5/PP2PPPP/R2QKBNR w KQkq - 4 5" },
      { move: "cxd5", fen: "r1bqkb1r/pppn1ppp/4pn2/3P2B1/3P4/2N5/PP2PPPP/R2QKBNR b KQkq - 0 5" },
      { move: "exd5", fen: "r1bqkb1r/pppn1ppp/5n2/3p2B1/3P4/2N5/PP2PPPP/R2QKBNR w KQkq - 0 6" },
      { move: "Nxd5", fen: "r1bqkb1r/pppn1ppp/5n2/3N2B1/3P4/8/PP2PPPP/R2QKBNR b KQkq - 0 6", annotation: "The trap!" },
      { move: "Nxd5", fen: "r1bqkb1r/ppp2ppp/5n2/3n2B1/3P4/8/PP2PPPP/R2QKBNR w KQkq - 0 7" },
      { move: "Bxd8", fen: "r1bBkb1r/ppp2ppp/5n2/3n4/3P4/8/PP2PPPP/R2QKBNR b KQkq - 0 7", annotation: "White takes the queen!" },
      { move: "Bb4+", fen: "r1bBk2r/ppp2ppp/5n2/3n4/1b1P4/8/PP2PPPP/R2QKBNR w KQkq - 1 8", annotation: "Check!" },
      { move: "Qd2", fen: "r1bBk2r/ppp2ppp/5n2/3n4/1b1P4/8/PP1QPPPP/R3KBNR b KQkq - 2 8" },
      { move: "Bxd2+", fen: "r1bBk2r/ppp2ppp/5n2/3n4/3P4/8/PP1bPPPP/R3KBNR w KQkq - 0 9" },
      { move: "Kxd2", fen: "r1bBk2r/ppp2ppp/5n2/3n4/3P4/8/PP1KPPPP/R4BNR b kq - 0 9" },
      { move: "Kxd8", fen: "r1bk3r/ppp2ppp/5n2/3n4/3P4/8/PP1KPPPP/R4BNR w - - 0 10", annotation: "Black wins the queen for two minor pieces!" }
    ],
    benefitsColor: "black",
    eco: "D51",
    openingName: "Queen's Gambit Declined",
    variationName: "Elephant Trap",
    explanation: "After Bg5 Nbd7 cxd5 exd5, if White plays Nxd5??, Black plays Nxd5! Bxd8 Bb4+! wins White's queen. The bishop check with Bb4+ is the key move that makes the combination work.",
    keyIdea: "The discovered check with Bb4+ wins the queen",
    commonMistake: "White plays Nxd5 thinking they win a pawn",
    difficulty: "intermediate",
    trapType: "material",
    frequency: "common",
    tags: ["queen's gambit", "declined", "discovered check", "queen trap"]
  },

  // ==================== SICILIAN DEFENSE TRAPS ====================
  {
    name: "Siberian Trap",
    description: "A devastating trap in the Sicilian Smith-Morra Gambit that wins White's queen.",
    setupFen: "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
    triggerMove: "cxd4",
    triggerFen: "r1bqkbnr/pp1ppppp/2n5/8/3pP3/2P5/PP1P1PPP/RNBQKBNR w KQkq - 0 3",
    refutationMoves: [
      { move: "cxd4", fen: "r1bqkbnr/pp1ppppp/2n5/8/3PP3/8/PP3PPP/RNBQKBNR b KQkq - 0 3" },
      { move: "d6", fen: "r1bqkbnr/pp2pppp/2np4/8/3PP3/8/PP3PPP/RNBQKBNR w KQkq - 0 4" },
      { move: "Nf3", fen: "r1bqkbnr/pp2pppp/2np4/8/3PP3/5N2/PP3PPP/RNBQKB1R b KQkq - 1 4" },
      { move: "Nf6", fen: "r1bqkb1r/pp2pppp/2np1n2/8/3PP3/5N2/PP3PPP/RNBQKB1R w KQkq - 2 5" },
      { move: "Nc3", fen: "r1bqkb1r/pp2pppp/2np1n2/8/3PP3/2N2N2/PP3PPP/R1BQKB1R b KQkq - 3 5" },
      { move: "e6", fen: "r1bqkb1r/pp3ppp/2nppn2/8/3PP3/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 6" },
      { move: "Bc4", fen: "r1bqkb1r/pp3ppp/2nppn2/8/2BPP3/2N2N2/PP3PPP/R1BQK2R b KQkq - 1 6" },
      { move: "Be7", fen: "r1bqk2r/pp2bppp/2nppn2/8/2BPP3/2N2N2/PP3PPP/R1BQK2R w KQkq - 2 7" },
      { move: "O-O", fen: "r1bqk2r/pp2bppp/2nppn2/8/2BPP3/2N2N2/PP3PPP/R1BQ1RK1 b kq - 3 7" },
      { move: "O-O", fen: "r1bq1rk1/pp2bppp/2nppn2/8/2BPP3/2N2N2/PP3PPP/R1BQ1RK1 w - - 4 8" },
      { move: "Qe2", fen: "r1bq1rk1/pp2bppp/2nppn2/8/2BPP3/2N2N2/PP2QPPP/R1B2RK1 b - - 5 8", annotation: "The trap is set!" },
      { move: "b5", fen: "r1bq1rk1/p3bppp/2nppn2/1p6/2BPP3/2N2N2/PP2QPPP/R1B2RK1 w - b6 0 9", annotation: "Attacking the bishop" },
      { move: "Bb3", fen: "r1bq1rk1/p3bppp/2nppn2/1p6/3PP3/1BN2N2/PP2QPPP/R1B2RK1 b - - 1 9" },
      { move: "Na5", fen: "r1bq1rk1/p3bppp/3ppn2/np6/3PP3/1BN2N2/PP2QPPP/R1B2RK1 w - - 2 10", annotation: "Knight attacks bishop" },
      { move: "e5", fen: "r1bq1rk1/p3bppp/3pp3/np2Pn2/3P4/1BN2N2/PP2QPPP/R1B2RK1 b - - 0 10" },
      { move: "Nc4", fen: "r1bq1rk1/p3bppp/3pp3/4Pn2/2nP4/1BN2N2/PP2QPPP/R1B2RK1 w - - 1 11", annotation: "Fork! Wins the queen!" }
    ],
    benefitsColor: "black",
    eco: "B21",
    openingName: "Sicilian Defense",
    variationName: "Smith-Morra Gambit, Siberian Trap",
    explanation: "In the Smith-Morra Gambit, after a specific sequence, Black plays b5 and Na5 to attack the bishop. After e5, Nc4! forks the queen and bishop, winning material.",
    keyIdea: "Knight fork on c4 wins White's queen",
    commonMistake: "White plays Qe2 allowing the b5-Na5-Nc4 sequence",
    difficulty: "advanced",
    trapType: "material",
    frequency: "rare",
    tags: ["sicilian", "smith-morra", "knight fork", "queen trap"]
  },

  // ==================== ENGLUND GAMBIT TRAP ====================
  {
    name: "Englund Gambit Trap",
    description: "A surprise weapon that can win White's queen in the opening.",
    setupFen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1",
    triggerMove: "e5",
    triggerFen: "rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 2",
    refutationMoves: [
      { move: "dxe5", fen: "rnbqkbnr/pppp1ppp/8/4P3/8/8/PPP1PPPP/RNBQKBNR b KQkq - 0 2" },
      { move: "Nc6", fen: "r1bqkbnr/pppp1ppp/2n5/4P3/8/8/PPP1PPPP/RNBQKBNR w KQkq - 1 3" },
      { move: "Nf3", fen: "r1bqkbnr/pppp1ppp/2n5/4P3/8/5N2/PPP1PPPP/RNBQKB1R b KQkq - 2 3" },
      { move: "Qe7", fen: "r1b1kbnr/ppppqppp/2n5/4P3/8/5N2/PPP1PPPP/RNBQKB1R w KQkq - 3 4" },
      { move: "Bf4", fen: "r1b1kbnr/ppppqppp/2n5/4P3/5B2/5N2/PPP1PPPP/RN1QKB1R b KQkq - 4 4", annotation: "Natural development but..." },
      { move: "Qb4+", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/1q3B2/5N2/PPP1PPPP/RN1QKB1R w KQkq - 5 5", annotation: "Check! Attacks b2 and bishop" },
      { move: "Bd2", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/1q6/5N2/PPPBPPPP/RN1QKB1R b KQkq - 6 5" },
      { move: "Qxb2", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/8/5N2/PqPBPPPP/RN1QKB1R w KQkq - 0 6", annotation: "Threatens Qxa1" },
      { move: "Bc3", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/8/2B2N2/PqP1PPPP/RN1QKB1R b KQkq - 1 6", annotation: "Trying to trap the queen" },
      { move: "Bb4", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/1b6/2B2N2/PqP1PPPP/RN1QKB1R w KQkq - 2 7", annotation: "Pinning the bishop!" },
      { move: "Qd2", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/1b6/2B2N2/PqPQPPPP/RN2KB1R b KQkq - 3 7" },
      { move: "Bxc3", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/8/2b2N2/PqPQPPPP/RN2KB1R w KQkq - 0 8" },
      { move: "Qxc3", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/8/2Q2N2/PqP1PPPP/RN2KB1R b KQkq - 0 8" },
      { move: "Qc1#", fen: "r1b1kbnr/pppp1ppp/2n5/4P3/8/2Q2N2/P1P1PPPP/RNq1KB1R w KQkq - 1 9", annotation: "Checkmate!" }
    ],
    benefitsColor: "black",
    eco: "A40",
    openingName: "Englund Gambit",
    variationName: "Main Line Trap",
    explanation: "The Englund Gambit (1.d4 e5) is dubious but contains vicious traps. After dxe5 Nc6 Nf3 Qe7 Bf4??, Black plays Qb4+! winning material or even delivering mate with Qc1#.",
    keyIdea: "Queen invasion on b4 with check leads to material win or mate",
    commonMistake: "White plays Bf4 allowing Qb4+ check",
    difficulty: "beginner",
    trapType: "mating",
    frequency: "occasional",
    tags: ["englund gambit", "queen check", "quick win", "surprise"]
  },

  // ==================== CARO-KANN TRAP ====================
  {
    name: "Caro-Kann Smothered Mate",
    description: "A quick smothered mate trap in the Caro-Kann Two Knights Attack.",
    setupFen: "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    triggerMove: "Nc3",
    triggerFen: "rnbqkbnr/pp1ppppp/2p5/8/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
    refutationMoves: [
      { move: "d5", fen: "rnbqkbnr/pp2pppp/2p5/3p4/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq d6 0 3" },
      { move: "Nf3", fen: "rnbqkbnr/pp2pppp/2p5/3p4/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 1 3" },
      { move: "dxe4", fen: "rnbqkbnr/pp2pppp/2p5/8/4p3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4" },
      { move: "Nxe4", fen: "rnbqkbnr/pp2pppp/2p5/8/4N3/5N2/PPPP1PPP/R1BQKB1R b KQkq - 0 4" },
      { move: "Nd7", fen: "r1bqkbnr/pp1npppp/2p5/8/4N3/5N2/PPPP1PPP/R1BQKB1R w KQkq - 1 5" },
      { move: "Qe2", fen: "r1bqkbnr/pp1npppp/2p5/8/4N3/5N2/PPPPQPPP/R1B1KB1R b KQkq - 2 5", annotation: "A natural move but..." },
      { move: "Ngf6", fen: "r1bqkb1r/pp1npppp/2p2n2/8/4N3/5N2/PPPPQPPP/R1B1KB1R w KQkq - 3 6", annotation: "Attacking the knight" },
      { move: "Nd6#", fen: "r1bqkb1r/pp1npppp/2pN1n2/8/8/5N2/PPPPQPPP/R1B1KB1R b KQkq - 4 6", annotation: "Smothered Mate!" }
    ],
    benefitsColor: "white",
    eco: "B10",
    openingName: "Caro-Kann Defense",
    variationName: "Two Knights Attack",
    explanation: "In the Two Knights Attack, after Nd7 Qe2 Ngf6??, White has Nd6#! The black king is smothered by its own pieces. Black should play Ndf6 instead to avoid this trap.",
    keyIdea: "Smothered mate with the knight on d6",
    commonMistake: "Black plays Ngf6 instead of Ndf6",
    difficulty: "intermediate",
    trapType: "mating",
    frequency: "rare",
    tags: ["caro-kann", "two knights", "smothered mate", "quick mate"]
  }
];

async function seedTraps() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check current count
    const existingCount = await TrapModel.countDocuments();
    console.log(`Current trap count: ${existingCount}`);

    if (existingCount > 0) {
      console.log('Traps already exist. Skipping seed.');
      console.log('To re-seed, first delete existing traps or use updateExisting option.');
      await mongoose.disconnect();
      return;
    }

    console.log(`Seeding ${initialTraps.length} traps...`);

    for (const trap of initialTraps) {
      try {
        const newTrap = new TrapModel(trap);
        await newTrap.save();
        console.log(`  ✓ Created: ${trap.name}`);
      } catch (err: any) {
        console.error(`  ✗ Error creating ${trap.name}:`, err.message);
      }
    }

    const finalCount = await TrapModel.countDocuments();
    console.log(`\nSeeding complete. Total traps: ${finalCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding traps:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTraps();
