/**
 * Additional chess opening traps - Part 2
 * Run with: npx ts-node scripts/seed-traps-additional.ts
 */

import * as mongoose from 'mongoose';
import { TrapModel, ITrap } from '../app/models/trap.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mdr-categories';

const additionalTraps: Partial<ITrap>[] = [
  // ==================== RUY LOPEZ TRAPS ====================
  {
    name: "Mortimer Trap",
    description: "A cunning trap in the Ruy Lopez where Black sacrifices a pawn to win a piece with a queen fork.",
    setupFen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4",
    triggerMove: "Ne7",
    triggerFen: "r1bqkb1r/ppppnppp/2n5/1B2p3/4P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5",
    refutationMoves: [
      { move: "Nxe5", fen: "r1bqkb1r/ppppnppp/2n5/1B2N3/4P3/3P4/PPP2PPP/RNBQK2R b KQkq - 0 5", annotation: "White takes the bait!" },
      { move: "c6", fen: "r1bqkb1r/pp1pnppp/2n5/1B2N3/4P3/3P4/PPP2PPP/RNBQK2R w KQkq - 0 6", annotation: "Attacking bishop, threatening Qa5+" },
      { move: "Ba4", fen: "r1bqkb1r/pp1pnppp/2n5/4N3/B3P3/3P4/PPP2PPP/RNBQK2R b KQkq - 1 6" },
      { move: "Qa5+", fen: "r1b1kb1r/pp1pnppp/2n5/q3N3/B3P3/3P4/PPP2PPP/RNBQK2R w KQkq - 2 7", annotation: "Fork! Wins the knight" }
    ],
    benefitsColor: "black",
    eco: "C65",
    openingName: "Ruy Lopez",
    variationName: "Berlin Defense, Mortimer Variation",
    explanation: "After 4.d3 Ne7 (an unusual move), if White grabs the pawn with Nxe5, Black plays c6! attacking the bishop and threatening Qa5+ which forks the king and knight. Black wins a piece.",
    keyIdea: "Queen fork on a5 wins the knight after c6 attacks the bishop",
    commonMistake: "White captures Nxe5 thinking it wins a free pawn",
    difficulty: "intermediate",
    trapType: "material",
    frequency: "rare",
    tags: ["ruy lopez", "berlin", "queen fork", "mortimer"]
  },

  // ==================== QUEEN'S GAMBIT TRAPS ====================
  {
    name: "Cambridge Springs Trap",
    description: "A sharp trap in the Queen's Gambit Declined where Black's queen becomes extremely active on a5.",
    setupFen: "r1bqkb1r/pp1n1ppp/2p1pn2/3p2B1/2PP4/2N2N2/PP2PPPP/R2QKB1R b KQkq - 5 6",
    triggerMove: "Qa5",
    triggerFen: "r1b1kb1r/pp1n1ppp/2p1pn2/q2p2B1/2PP4/2N2N2/PP2PPPP/R2QKB1R w KQkq - 6 7",
    refutationMoves: [
      { move: "Bxf6", fen: "r1b1kb1r/pp1n1ppp/2p1pB2/q2p4/2PP4/2N2N2/PP2PPPP/R2QKB1R b KQkq - 0 7", annotation: "White tries to simplify" },
      { move: "Nxf6", fen: "r1b1kb1r/pp3ppp/2p1pn2/q2p4/2PP4/2N2N2/PP2PPPP/R2QKB1R w KQkq - 0 8" },
      { move: "e3", fen: "r1b1kb1r/pp3ppp/2p1pn2/q2p4/2PP4/2N1PN2/PP3PPP/R2QKB1R b KQkq - 0 8" },
      { move: "Ne4", fen: "r1b1kb1r/pp3ppp/2p1p3/q2p4/2PPn3/2N1PN2/PP3PPP/R2QKB1R w KQkq - 1 9", annotation: "Knight enters powerfully" },
      { move: "Qc2", fen: "r1b1kb1r/pp3ppp/2p1p3/q2p4/2PPn3/2N1PN2/PPQ2PPP/R3KB1R b KQkq - 2 9" },
      { move: "Bb4", fen: "r1b1k2r/pp3ppp/2p1p3/q2p4/1bPPn3/2N1PN2/PPQ2PPP/R3KB1R w KQkq - 3 10", annotation: "Pinning the knight!" }
    ],
    benefitsColor: "black",
    eco: "D52",
    openingName: "Queen's Gambit Declined",
    variationName: "Cambridge Springs Defense",
    explanation: "The Cambridge Springs Defense (6...Qa5) puts immediate pressure on White. Black threatens to win material with discovered attacks on the pinned c3 knight. The position is rich in tactical possibilities.",
    keyIdea: "Queen on a5 creates pins and threats along the a5-e1 diagonal",
    commonMistake: "White underestimates the power of the queen on a5",
    difficulty: "advanced",
    trapType: "positional",
    frequency: "common",
    tags: ["queen's gambit", "declined", "cambridge springs", "pin"]
  },
  {
    name: "Rubinstein Trap",
    description: "A trap where Black's queen gets trapped on the back rank after capturing a seemingly free pawn.",
    setupFen: "r2q1rk1/pp1bbppp/2n1p3/3pP3/3P1B2/2NB1N2/PP3PPP/R2Q1RK1 b - - 0 11",
    triggerMove: "Nh5",
    triggerFen: "r2q1rk1/pp1bbppp/2n1p3/3pP2n/3P1B2/2NB1N2/PP3PPP/R2Q1RK1 w - - 1 12",
    refutationMoves: [
      { move: "Nxd5", fen: "r2q1rk1/pp1bbppp/2n1p3/3NP2n/3P1B2/3B1N2/PP3PPP/R2Q1RK1 b - - 0 12", annotation: "The trap!" },
      { move: "Nxf4", fen: "r2q1rk1/pp1bbppp/2n1p3/3NP3/3P1n2/3B1N2/PP3PPP/R2Q1RK1 w - - 0 13", annotation: "Black takes the bishop" },
      { move: "Nxe7+", fen: "r2q1rk1/pp1bNppp/2n1p3/4P3/3P1n2/3B1N2/PP3PPP/R2Q1RK1 b - - 0 13" },
      { move: "Qxe7", fen: "r4rk1/pp1bqppp/2n1p3/4P3/3P1n2/3B1N2/PP3PPP/R2Q1RK1 w - - 0 14" },
      { move: "Bc4", fen: "r4rk1/pp1bqppp/2n1p3/4P3/2BP1n2/5N2/PP3PPP/R2Q1RK1 b - - 1 14", annotation: "Attacking e6 and threatening Bc7" }
    ],
    benefitsColor: "white",
    eco: "D61",
    openingName: "Queen's Gambit Declined",
    variationName: "Orthodox Defense",
    explanation: "After Black plays Nh5 attacking the bishop, White plays Nxd5! If Black captures exd5, White has Bc7 trapping the queen. Named after Akiba Rubinstein who fell for this trap twice!",
    keyIdea: "Bishop to c7 traps the queen on the back rank",
    commonMistake: "Black plays Nh5 thinking the bishop must retreat",
    difficulty: "intermediate",
    trapType: "material",
    frequency: "occasional",
    tags: ["queen's gambit", "declined", "queen trap", "rubinstein"]
  },

  // ==================== BUDAPEST GAMBIT TRAP ====================
  {
    name: "Fajarowicz Trap",
    description: "A sharp trap in the Budapest Gambit where Black sacrifices material for a devastating attack.",
    setupFen: "rnbqkbnr/pppp1ppp/8/4P3/8/8/PPP1PPPP/RNBQKBNR b KQkq - 0 3",
    triggerMove: "Ne4",
    triggerFen: "rnbqkbnr/pppp1ppp/8/4P3/4n3/8/PPP1PPPP/RNBQKBNR w KQkq - 1 4",
    refutationMoves: [
      { move: "Qc2", fen: "rnbqkbnr/pppp1ppp/8/4P3/4n3/8/PPQPPPPP/RNB1KBNR b KQkq - 2 4" },
      { move: "Bb4+", fen: "rnbqk1nr/pppp1ppp/8/4P3/1b2n3/8/PPQPPPPP/RNB1KBNR w KQkq - 3 5", annotation: "Check!" },
      { move: "Nd2", fen: "rnbqk1nr/pppp1ppp/8/4P3/1b2n3/8/PPQNPPPP/R1B1KBNR b KQkq - 4 5" },
      { move: "d5", fen: "rnbqk1nr/ppp2ppp/8/3pP3/1b2n3/8/PPQNPPPP/R1B1KBNR w KQkq d6 0 6" },
      { move: "exd6", fen: "rnbqk1nr/ppp2ppp/3P4/8/1b2n3/8/PPQNPPPP/R1B1KBNR b KQkq - 0 6" },
      { move: "Bf5", fen: "rn1qk1nr/ppp2ppp/3P4/5b2/1b2n3/8/PPQNPPPP/R1B1KBNR w KQkq - 1 7", annotation: "Attacking the queen!" },
      { move: "Qa4+", fen: "rn1qk1nr/ppp2ppp/3P4/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR b KQkq - 2 7" },
      { move: "Nc6", fen: "r2qk1nr/ppp2ppp/2nP4/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR w KQkq - 3 8" },
      { move: "dxc7", fen: "r2qk1nr/ppP2ppp/2n5/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR b KQkq - 0 8" },
      { move: "Qe7", fen: "r3k1nr/ppP1qppp/2n5/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR w KQkq - 1 9", annotation: "Threatening Nd3#!" }
    ],
    benefitsColor: "black",
    eco: "A51",
    openingName: "Budapest Gambit",
    variationName: "Fajarowicz Variation",
    explanation: "In the Fajarowicz Variation (3...Ne4 instead of 3...Ng4), Black sacrifices pawns for rapid piece activity. Multiple traps exist including knight forks and smothered mate patterns.",
    keyIdea: "Rapid piece development creates mating threats",
    commonMistake: "White plays mechanically without seeing the tactical threats",
    difficulty: "advanced",
    trapType: "tactical",
    frequency: "rare",
    tags: ["budapest gambit", "fajarowicz", "attack", "sacrifice"]
  },

  // ==================== BOGO-INDIAN TRAP ====================
  {
    name: "Monticelli Trap",
    description: "A classic trap in the Bogo-Indian where White wins the exchange with a surprising knight move.",
    setupFen: "r1bq1rk1/pp2bppp/2n1p3/3p4/2PP4/5NP1/PP2PPBP/R1BQ1RK1 b - - 0 9",
    triggerMove: "Ne4",
    triggerFen: "r1bq1rk1/pp2bppp/4p3/3p4/2PPn3/5NP1/PP2PPBP/R1BQ1RK1 w - - 1 10",
    refutationMoves: [
      { move: "Qc2", fen: "r1bq1rk1/pp2bppp/4p3/3p4/2PPn3/5NP1/PPQ1PPBP/R1B2RK1 b - - 2 10" },
      { move: "Nxc3", fen: "r1bq1rk1/pp2bppp/4p3/3p4/2PP4/2n2NP1/PPQ1PPBP/R1B2RK1 w - - 0 11" },
      { move: "Ng5", fen: "r1bq1rk1/pp2bppp/4p3/3p2N1/2PP4/2n3P1/PPQ1PPBP/R1B2RK1 b - - 1 11", annotation: "The trap! Threatens Qxh7# and Bxb7" }
    ],
    benefitsColor: "white",
    eco: "E11",
    openingName: "Bogo-Indian Defense",
    variationName: "Exchange Variation",
    explanation: "After Black plays Ne4 and captures on c3, White's Ng5! is crushing. It threatens Qxh7# and attacks the b7 bishop. White wins the exchange or more.",
    keyIdea: "Ng5 creates dual threats against h7 and b7",
    commonMistake: "Black takes on c3 without seeing Ng5",
    difficulty: "intermediate",
    trapType: "tactical",
    frequency: "rare",
    tags: ["bogo-indian", "knight attack", "exchange", "monticelli"]
  },

  // ==================== BLACKMAR-DIEMER TRAP ====================
  {
    name: "Halosar Trap",
    description: "A spectacular trap in the Blackmar-Diemer Gambit where White wins decisive material.",
    setupFen: "rnbqkbnr/ppp2ppp/8/3p4/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2",
    triggerMove: "dxe4",
    triggerFen: "rnbqkbnr/ppp2ppp/8/8/3Pp3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",
    refutationMoves: [
      { move: "Nc3", fen: "rnbqkbnr/ppp2ppp/8/8/3Pp3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3" },
      { move: "Nf6", fen: "rnbqkb1r/ppp2ppp/5n2/8/3Pp3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4" },
      { move: "f3", fen: "rnbqkb1r/ppp2ppp/5n2/8/3Pp3/2N2P2/PPP3PP/R1BQKBNR b KQkq - 0 4" },
      { move: "exf3", fen: "rnbqkb1r/ppp2ppp/5n2/8/3P4/2N2p2/PPP3PP/R1BQKBNR w KQkq - 0 5" },
      { move: "Qxf3", fen: "rnbqkb1r/ppp2ppp/5n2/8/3P4/2N2Q2/PPP3PP/R1B1KBNR b KQkq - 0 5", annotation: "Ryder Gambit" },
      { move: "Qxd4", fen: "rnb1kb1r/ppp2ppp/5n2/8/3q4/2N2Q2/PPP3PP/R1B1KBNR w KQkq - 0 6" },
      { move: "Be3", fen: "rnb1kb1r/ppp2ppp/5n2/8/3q4/2N1BQ2/PPP3PP/R3KBNR b KQkq - 1 6" },
      { move: "Qb4", fen: "rnb1kb1r/ppp2ppp/5n2/8/1q6/2N1BQ2/PPP3PP/R3KBNR w KQkq - 2 7" },
      { move: "O-O-O", fen: "rnb1kb1r/ppp2ppp/5n2/8/1q6/2N1BQ2/PPP3PP/2KR1BNR b kq - 3 7" },
      { move: "Bg4", fen: "rn2kb1r/ppp2ppp/5n2/8/1q4b1/2N1BQ2/PPP3PP/2KR1BNR w kq - 4 8", annotation: "Black tries to win material..." },
      { move: "Nb5", fen: "rn2kb1r/ppp2ppp/5n2/1N6/1q4b1/4BQ2/PPP3PP/2KR1BNR b kq - 5 8", annotation: "The Halosar Trap! Threatens Nxc7#" }
    ],
    benefitsColor: "white",
    eco: "D00",
    openingName: "Blackmar-Diemer Gambit",
    variationName: "Ryder Gambit, Halosar Trap",
    explanation: "In the Blackmar-Diemer Gambit Ryder variation, after Black grabs the d4 pawn and plays Qb4-Bg4, White has Nb5! threatening Nxc7#. Black cannot capture the knight and must lose material.",
    keyIdea: "Nb5 threatens unstoppable mate on c7",
    commonMistake: "Black plays Bg4 without seeing Nb5!",
    difficulty: "intermediate",
    trapType: "mating",
    frequency: "occasional",
    tags: ["blackmar-diemer", "ryder gambit", "halosar", "mate threat"]
  },

  // ==================== STAFFORD GAMBIT TRAP ====================
  {
    name: "Stafford Gambit Trap",
    description: "A highly venomous trap in the Stafford Gambit where Black wins White's queen.",
    setupFen: "r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 3",
    triggerMove: "Nc6",
    triggerFen: "r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    refutationMoves: [
      { move: "Nxc6", fen: "r1bqkbnr/pppp1ppp/2N5/8/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 4" },
      { move: "dxc6", fen: "r1bqkbnr/ppp2ppp/2p5/8/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 5", annotation: "The Stafford Gambit!" },
      { move: "d3", fen: "r1bqkbnr/ppp2ppp/2p5/8/4P3/3P4/PPP2PPP/RNBQKB1R b KQkq - 0 5" },
      { move: "Bc5", fen: "r1bqk1nr/ppp2ppp/2p5/2b5/4P3/3P4/PPP2PPP/RNBQKB1R w KQkq - 1 6" },
      { move: "Bg5", fen: "r1bqk1nr/ppp2ppp/2p5/2b3B1/4P3/3P4/PPP2PPP/RN1QKB1R b KQkq - 2 6", annotation: "Natural but loses!" },
      { move: "Nxe4", fen: "r1bqk2r/ppp2ppp/2p5/2b3B1/4n3/3P4/PPP2PPP/RN1QKB1R w KQkq - 0 7", annotation: "Sacrifice!" },
      { move: "Bxd8", fen: "r1bBk2r/ppp2ppp/2p5/2b5/4n3/3P4/PPP2PPP/RN1QKB1R b KQkq - 0 7" },
      { move: "Bxf2+", fen: "r1bBk2r/ppp2ppp/2p5/8/4n3/3P4/PPP2bPP/RN1QKB1R w KQkq - 0 8", annotation: "Check!" },
      { move: "Ke2", fen: "r1bBk2r/ppp2ppp/2p5/8/4n3/3P4/PPP1KbPP/RN1Q1B1R b kq - 1 8" },
      { move: "Bg4+", fen: "r1bBk2r/ppp2ppp/2p5/8/4n1b1/3P4/PPP1KbPP/RN1Q1B1R w kq - 2 9", annotation: "Wins the queen!" }
    ],
    benefitsColor: "black",
    eco: "C42",
    openingName: "Petrov's Defense",
    variationName: "Stafford Gambit",
    explanation: "The Stafford Gambit (2...Nf6 3.Nxe5 Nc6) is objectively dubious but full of traps. After 6.Bg5?? Nxe4! 7.Bxd8 Bxf2+ 8.Ke2 Bg4+ wins the queen. Named after Joseph Stafford and popularized by IM Eric Rosen.",
    keyIdea: "Bishop checks on f2 and g4 win White's queen",
    commonMistake: "White plays Bg5 allowing the queen sacrifice",
    difficulty: "beginner",
    trapType: "material",
    frequency: "common",
    tags: ["stafford gambit", "petrov", "queen sacrifice", "eric rosen"]
  },

  // ==================== FRIED LIVER ATTACK ====================
  {
    name: "Fried Liver Attack",
    description: "A famous attacking sequence where White sacrifices a knight to expose Black's king.",
    setupFen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    triggerMove: "Ng5",
    triggerFen: "r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4",
    refutationMoves: [
      { move: "d5", fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq d6 0 5" },
      { move: "exd5", fen: "r1bqkb1r/ppp2ppp/2n2n2/3Pp1N1/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 5" },
      { move: "Nxd5", fen: "r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 6", annotation: "Black takes... but..." },
      { move: "Nxf7", fen: "r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R b KQkq - 0 6", annotation: "The Fried Liver Attack!" },
      { move: "Kxf7", fen: "r1bqkb1r/ppp2kpp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R w KQ - 0 7" },
      { move: "Qf3+", fen: "r1bqkb1r/ppp2kpp/2n5/3np3/2B5/5Q2/PPPP1PPP/RNB1K2R b KQ - 1 7", annotation: "Check! Attacking king and knight" }
    ],
    benefitsColor: "white",
    eco: "C57",
    openingName: "Italian Game",
    variationName: "Two Knights Defense, Fried Liver Attack",
    explanation: "After 4.Ng5 d5 5.exd5 Nxd5??, White plays 6.Nxf7!! sacrificing the knight. After Kxf7, Qf3+ forks the king and knight. White gets a crushing attack against the exposed king.",
    keyIdea: "Knight sacrifice exposes the king to a devastating attack",
    commonMistake: "Black captures Nxd5 instead of playing Na5 or b5",
    difficulty: "beginner",
    trapType: "mating",
    frequency: "common",
    tags: ["italian game", "two knights", "fried liver", "sacrifice", "attack"]
  },

  // ==================== TENNISON GAMBIT ====================
  {
    name: "Tennison Gambit Intercontinental Ballistic Missile",
    description: "A meme opening with a real trap that can win the queen.",
    setupFen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1",
    triggerMove: "d5",
    triggerFen: "rnbqkbnr/ppp1pppp/8/3p4/8/5N2/PPPPPPPP/RNBQKB1R w KQkq d6 0 2",
    refutationMoves: [
      { move: "e4", fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq e3 0 2", annotation: "The Tennison Gambit!" },
      { move: "dxe4", fen: "rnbqkbnr/ppp1pppp/8/8/4p3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3" },
      { move: "Ng5", fen: "rnbqkbnr/ppp1pppp/8/6N1/4p3/8/PPPP1PPP/RNBQKB1R b KQkq - 1 3" },
      { move: "Nf6", fen: "rnbqkb1r/ppp1pppp/5n2/6N1/4p3/8/PPPP1PPP/RNBQKB1R w KQkq - 2 4" },
      { move: "d3", fen: "rnbqkb1r/ppp1pppp/5n2/6N1/4p3/3P4/PPP2PPP/RNBQKB1R b KQkq - 0 4" },
      { move: "exd3", fen: "rnbqkb1r/ppp1pppp/5n2/6N1/8/3p4/PPP2PPP/RNBQKB1R w KQkq - 0 5" },
      { move: "Bxd3", fen: "rnbqkb1r/ppp1pppp/5n2/6N1/8/3B4/PPP2PPP/RNBQK2R b KQkq - 0 5" },
      { move: "h6", fen: "rnbqkb1r/ppp1ppp1/5n1p/6N1/8/3B4/PPP2PPP/RNBQK2R w KQkq - 0 6", annotation: "Black kicks the knight..." },
      { move: "Nxf7", fen: "rnbqkb1r/ppp1pNp1/5n1p/8/8/3B4/PPP2PPP/RNBQK2R b KQkq - 0 6", annotation: "Sacrifice!" },
      { move: "Kxf7", fen: "rnbqkb1r/ppp1p1p1/5n1p/8/8/3B4/PPP2PPP/RNBQK2R w KQ - 0 7" },
      { move: "Bg6+", fen: "rnbqkb1r/ppp1p1p1/5nBp/8/8/8/PPP2PPP/RNBQK2R b KQ - 1 7", annotation: "Check!" },
      { move: "Ke6", fen: "rnbqkb1r/ppp1p1p1/4knBp/8/8/8/PPP2PPP/RNBQK2R w KQ - 2 8" },
      { move: "Qd3", fen: "rnbqkb1r/ppp1p1p1/4knBp/8/8/3Q4/PPP2PPP/RNB1K2R b KQ - 3 8", annotation: "Threatening Qd5#" }
    ],
    benefitsColor: "white",
    eco: "A06",
    openingName: "Tennison Gambit",
    variationName: "ICBM Variation",
    explanation: "The Tennison Gambit (1.Nf3 d5 2.e4) is a dubious but trappy opening. After dxe4 Ng5, if Black plays naturally, White can sacrifice on f7 and get a strong attack. Made famous as a meme opening.",
    keyIdea: "Ng5 and Nxf7 sacrifice leads to king hunt",
    commonMistake: "Black plays h6 allowing the devastating Nxf7 sacrifice",
    difficulty: "beginner",
    trapType: "mating",
    frequency: "rare",
    tags: ["tennison gambit", "icbm", "meme opening", "sacrifice", "attack"]
  },

  // ==================== SCOTCH GAMBIT TRAP ====================
  {
    name: "Magnus Smith Trap",
    description: "A trap in the Scotch Gambit where Black wins material with a surprising knight move.",
    setupFen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 4 5",
    triggerMove: "d4",
    triggerFen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2BPP3/2P2N2/PP3PPP/RNBQK2R b KQkq d3 0 5",
    refutationMoves: [
      { move: "exd4", fen: "r1bqk2r/pppp1ppp/2n2n2/2b5/2BpP3/2P2N2/PP3PPP/RNBQK2R w KQkq - 0 6" },
      { move: "cxd4", fen: "r1bqk2r/pppp1ppp/2n2n2/2b5/2BPP3/5N2/PP3PPP/RNBQK2R b KQkq - 0 6" },
      { move: "Bb4+", fen: "r1bqk2r/pppp1ppp/2n2n2/8/1bBPP3/5N2/PP3PPP/RNBQK2R w KQkq - 1 7", annotation: "Check!" },
      { move: "Bd2", fen: "r1bqk2r/pppp1ppp/2n2n2/8/1bBPP3/5N2/PP1B1PPP/RN1QK2R b KQkq - 2 7" },
      { move: "Bxd2+", fen: "r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1b1PPP/RN1QK2R w KQkq - 0 8" },
      { move: "Nbxd2", fen: "r1bqk2r/pppp1ppp/2n2n2/8/2BPP3/5N2/PP1N1PPP/R2QK2R b KQkq - 0 8" },
      { move: "d5", fen: "r1bqk2r/ppp2ppp/2n2n2/3p4/2BPP3/5N2/PP1N1PPP/R2QK2R w KQkq d6 0 9", annotation: "Counterattack!" },
      { move: "exd5", fen: "r1bqk2r/ppp2ppp/2n2n2/3P4/2BP4/5N2/PP1N1PPP/R2QK2R b KQkq - 0 9" },
      { move: "Nxd5", fen: "r1bqk2r/ppp2ppp/2n5/3n4/2BP4/5N2/PP1N1PPP/R2QK2R w KQkq - 0 10" },
      { move: "O-O", fen: "r1bqk2r/ppp2ppp/2n5/3n4/2BP4/5N2/PP1N1PPP/R2Q1RK1 b kq - 1 10" },
      { move: "Ncb4", fen: "r1bqk2r/ppp2ppp/8/3n4/1nBP4/5N2/PP1N1PPP/R2Q1RK1 w kq - 2 11", annotation: "Knight attacks bishop and threatens Nc2" }
    ],
    benefitsColor: "black",
    eco: "C44",
    openingName: "Scotch Game",
    variationName: "Scotch Gambit, Magnus Smith Trap",
    explanation: "In the Scotch Gambit, after Black exchanges on d4 and plays Bb4+ Bd2 Bxd2+ Nbxd2 d5!, Black gets strong counterplay. The knights become very active with ideas like Ncb4.",
    keyIdea: "d5 counterattack and knight activity create problems for White",
    commonMistake: "White plays into the line without proper preparation",
    difficulty: "intermediate",
    trapType: "positional",
    frequency: "occasional",
    tags: ["scotch game", "gambit", "counterattack", "knight"]
  }
];

async function seedAdditionalTraps() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCount = await TrapModel.countDocuments();
    console.log(`Current trap count: ${existingCount}`);

    console.log(`Adding ${additionalTraps.length} more traps...`);

    let created = 0;
    let skipped = 0;

    for (const trap of additionalTraps) {
      try {
        // Check if trap already exists
        const existing = await TrapModel.findOne({ name: trap.name });
        if (existing) {
          console.log(`  ⊘ Skipped (exists): ${trap.name}`);
          skipped++;
          continue;
        }

        const newTrap = new TrapModel(trap);
        await newTrap.save();
        console.log(`  ✓ Created: ${trap.name}`);
        created++;
      } catch (err: any) {
        console.error(`  ✗ Error creating ${trap.name}:`, err.message);
      }
    }

    const finalCount = await TrapModel.countDocuments();
    console.log(`\nSeeding complete!`);
    console.log(`  Created: ${created}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total traps in database: ${finalCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding traps:', error);
    process.exit(1);
  }
}

seedAdditionalTraps();
