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
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d3",
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
    pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Nbd7 5. Nf3 c6",
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
    description: "A devastating trap in the Queen's Gambit Declined where White sacrifices a bishop to deliver a back-rank checkmate.",
    setupFen: "r4rk1/pp2qppp/2n1p3/2bpP3/2P5/2N2N2/PP3PPP/2RQ1RK1 b - - 0 12",
    pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O Nxc3 12. Rxc3 e5",
    triggerMove: "Nxe5",
    triggerFen: "r4rk1/pp2qppp/2n5/2bpn3/2P5/2R2N2/PP3PPP/3Q1RK1 w - - 0 14",
    refutationMoves: [
      { move: "dxe5", fen: "r4rk1/pp2qppp/2n5/2b1P3/2P5/2R2N2/PP3PPP/3Q1RK1 w - - 0 14" },
      { move: "Nxe5", fen: "r4rk1/pp2qppp/2n5/2b1N3/2P5/2R5/PP3PPP/3Q1RK1 b - - 0 14" },
      { move: "Qxe5", fen: "r4rk1/pp3ppp/2n5/2b1q3/2P5/2R5/PP3PPP/3Q1RK1 w - - 0 15", annotation: "Black captures, looks safe..." },
      { move: "Bxf7+", fen: "r4rk1/pp3Bpp/2n5/2b1q3/2P5/2R5/PP3PPP/3Q1RK1 b - - 0 15", annotation: "The stunning bishop sacrifice!" },
      { move: "Rxf7", fen: "r5k1/pp3rpp/2n5/2b1q3/2P5/2R5/PP3PPP/3Q1RK1 w - - 0 16", annotation: "Forced" },
      { move: "Qd8+", fen: "r2Q2k1/pp3rpp/2n5/2b1q3/2P5/2R5/PP3PPP/5RK1 b - - 1 16", annotation: "The queen invades!" },
      { move: "Rf8", fen: "r2Q1rk1/pp4pp/2n5/2b1q3/2P5/2R5/PP3PPP/5RK1 w - - 2 17" },
      { move: "Qxf8#", fen: "r4Qk1/pp4pp/2n5/2b1q3/2P5/2R5/PP3PPP/5RK1 b - - 0 17", annotation: "Checkmate! The Rubinstein Trap!" }
    ],
    benefitsColor: "white",
    eco: "D61",
    openingName: "Queen's Gambit Declined",
    variationName: "Orthodox Defense",
    explanation: "In the Orthodox Defense, after Black plays 12...e5 trying to free their position, if Black recaptures with 13...Nxe5?? White has the stunning 14.Bxf7+! After Rxf7, Qd8+ forces Rf8 and Qxf8# is checkmate! Named after Akiba Rubinstein who fell for this trap.",
    keyIdea: "Bishop sacrifice on f7 opens the back rank for a queen invasion and mate",
    commonMistake: "Black plays Nxe5 without seeing the back-rank mate",
    difficulty: "intermediate",
    trapType: "mating",
    frequency: "occasional",
    tags: ["queen's gambit", "declined", "back rank mate", "rubinstein", "sacrifice"]
  },

  // ==================== BUDAPEST GAMBIT TRAP ====================
  {
    name: "Fajarowicz Trap",
    description: "A sharp trap in the Budapest Gambit Fajarowicz Variation featuring a stunning smothered mate.",
    setupFen: "rnbqkb1r/pppp1ppp/8/4P3/8/5n2/PPPP1PPP/RNBQKBNR w KQkq - 1 3",
    pgn: "1. d4 Nf6 2. c4 e5 3. dxe5 Ne4",
    triggerMove: "Qc2",
    triggerFen: "rnbqkb1r/pppp1ppp/8/4P3/4n3/8/PPQ1PPPP/RNB1KBNR b KQkq - 1 4",
    refutationMoves: [
      { move: "Bb4+", fen: "rnbqk2r/pppp1ppp/8/4P3/1b2n3/8/PPQ1PPPP/RNB1KBNR w KQkq - 2 5", annotation: "Check!" },
      { move: "Nd2", fen: "rnbqk2r/pppp1ppp/8/4P3/1b2n3/8/PPQNPPPP/R1B1KBNR b KQkq - 3 5" },
      { move: "d5", fen: "rnbqk2r/ppp2ppp/8/3pP3/1b2n3/8/PPQNPPPP/R1B1KBNR w KQkq d6 0 6" },
      { move: "exd6", fen: "rnbqk2r/ppp2ppp/3P4/8/1b2n3/8/PPQNPPPP/R1B1KBNR b KQkq - 0 6", annotation: "White takes en passant" },
      { move: "Bf5", fen: "rn1qk2r/ppp2ppp/3P4/5b2/1b2n3/8/PPQNPPPP/R1B1KBNR w KQkq - 1 7", annotation: "Attacking the queen!" },
      { move: "Qa4+", fen: "rn1qk2r/ppp2ppp/3P4/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR b KQkq - 2 7", annotation: "White tries to escape with check" },
      { move: "Nc6", fen: "r2qk2r/ppp2ppp/2nP4/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR w KQkq - 3 8", annotation: "Black blocks and attacks the d6 pawn" },
      { move: "dxc7", fen: "r2qk2r/ppP2ppp/2n5/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR b KQkq - 0 8", annotation: "White promotes threat" },
      { move: "Qe7", fen: "r3k2r/ppP1qppp/2n5/5b2/Qb2n3/8/PP1NPPPP/R1B1KBNR w KQkq - 1 9", annotation: "Threatening Nd3#! Smothered mate!" },
      { move: "Qd1", fen: "r3k2r/ppP1qppp/2n5/5b2/1b2n3/8/PP1NPPPP/R1BQKBNR b KQkq - 2 9" },
      { move: "Nd3#", fen: "r3k2r/ppP1qppp/2n5/5b2/1b6/3n4/PP1NPPPP/R1BQKBNR w KQkq - 3 10", annotation: "Smothered Mate! Black wins" }
    ],
    benefitsColor: "black",
    eco: "A51",
    openingName: "Budapest Gambit",
    variationName: "Fajarowicz Variation",
    explanation: "In the Fajarowicz Variation (3...Ne4 instead of the main line 3...Ng4), Black develops rapidly and sets up tactical tricks. After Qc2, Black plays Bb4+ followed by d5 and Bf5 attacking the queen. The stunning finale is Nd3# - a smothered mate!",
    keyIdea: "Rapid piece development leads to smothered mate threat with Nd3#",
    commonMistake: "White plays Qc2 and Qa4+ without seeing the smothered mate",
    difficulty: "intermediate",
    trapType: "mating",
    frequency: "rare",
    tags: ["budapest gambit", "fajarowicz", "smothered mate", "attack"]
  },

  // ==================== BOGO-INDIAN TRAP ====================
  {
    name: "Monticelli Trap",
    description: "A classic trap in the Bogo-Indian where White wins material with a devastating knight move threatening mate.",
    setupFen: "r2q1rk1/pb2pppp/1pn2n2/3p4/2PP4/5NP1/PP2PPBP/R1BQ1RK1 b - - 0 8",
    pgn: "1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Bxd2+ 5. Qxd2 b6 6. g3 Bb7 7. Bg2 O-O 8. Nc3",
    triggerMove: "Ne4",
    triggerFen: "r2q1rk1/pb2pppp/1pn5/3p4/2PPn3/2N2NP1/PP2PPBP/R2Q1RK1 w - - 1 9",
    refutationMoves: [
      { move: "Qc2", fen: "r2q1rk1/pb2pppp/1pn5/3p4/2PPn3/2N2NP1/PPQ1PPBP/R4RK1 b - - 2 9", annotation: "Attacking the knight!" },
      { move: "Nxc3", fen: "r2q1rk1/pb2pppp/1pn5/3p4/2PP4/2n2NP1/PPQ1PPBP/R4RK1 w - - 0 10", annotation: "Black takes, expecting to win a pawn" },
      { move: "Ng5", fen: "r2q1rk1/pb2pppp/1pn5/3p2N1/2PP4/2n3P1/PPQ1PPBP/R4RK1 b - - 1 10", annotation: "The Monticelli Trap! Threatens Qxh7# AND Bxb7" }
    ],
    benefitsColor: "white",
    eco: "E11",
    openingName: "Bogo-Indian Defense",
    variationName: "Exchange Variation",
    explanation: "After Black plays Ne4 attacking the queen, White plays Qc2! If Black captures on c3, Ng5! is devastating - it threatens Qxh7# and also attacks the bishop on b7 via Bxb7. Black cannot defend both threats and loses material.",
    keyIdea: "Ng5 creates dual threats: Qxh7# and Bxb7 - Black cannot defend both",
    commonMistake: "Black plays Nxc3 expecting to win material but falls into Ng5!",
    difficulty: "intermediate",
    trapType: "tactical",
    frequency: "rare",
    tags: ["bogo-indian", "knight attack", "monticelli", "dual threat"]
  },

  // ==================== BLACKMAR-DIEMER TRAP ====================
  {
    name: "Halosar Trap",
    description: "A spectacular trap in the Blackmar-Diemer Gambit where White wins decisive material.",
    setupFen: "rnbqkbnr/ppp2ppp/8/3p4/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2",
    pgn: "1. d4 d5 2. e4",
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
    pgn: "1. e4 e5 2. Nf3 Nf6 3. Nxe5",
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
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6",
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
    pgn: "1. Nf3",
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
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6",
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
  },

  // ==================== ADDITIONAL RUY LOPEZ TRAPS ====================
  {
    name: "Tarrasch Trap",
    description: "A classic trap in the Ruy Lopez Open Defense where Black's bishop gets trapped after a greedy knight capture.",
    setupFen: "r1bq1rk1/2p2ppp/p1nbpn2/1p2P3/3P4/1B3N2/PPP1QPPP/RNB2RK1 b - - 0 10",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. Qe2 Bc5 10. c3",
    triggerMove: "Nxf2",
    triggerFen: "r1bq1rk1/2p2ppp/p1nbp3/1p2P3/8/1BP2N2/PP2nPPP/RNB2RK1 w - - 0 11",
    refutationMoves: [
      { move: "Rxf2", fen: "r1bq1rk1/2p2ppp/p1nbp3/1p2P3/8/1BP2N2/PP2RPPP/RNB3K1 b - - 0 11", annotation: "White sacrifices the exchange!" },
      { move: "Bxf2+", fen: "r1bq1rk1/2p2ppp/p1nbp3/1p2P3/8/1BP2N2/PP3bPP/RNB3K1 w - - 0 12" },
      { move: "Kh1", fen: "r1bq1rk1/2p2ppp/p1nbp3/1p2P3/8/1BP2N2/PP3bPP/RNB4K b - - 1 12", annotation: "The key move! Not taking the bishop" }
    ],
    benefitsColor: "white",
    eco: "C80",
    openingName: "Ruy Lopez",
    variationName: "Open Defense, Tarrasch Trap",
    explanation: "In the Open Defense, after Black develops normally, if Black greedily captures with Nxf2?, White plays Rxf2! Bxf2+ Kh1! - and Black's bishop on f2 is trapped! It has no escape squares and will be won. Named after Siegbert Tarrasch.",
    keyIdea: "After Rxf2 Bxf2+ Kh1! the bishop on f2 is completely trapped",
    commonMistake: "Black plays Nxf2 thinking to win the exchange, but loses the bishop",
    difficulty: "intermediate",
    trapType: "material",
    frequency: "occasional",
    tags: ["ruy lopez", "open defense", "tarrasch", "trapped piece"]
  },
  {
    name: "Bernstein Trap",
    description: "A devastating trap in the Ruy Lopez Old Steinitz Defense where Black exploits White's overextension.",
    setupFen: "r1bqkbnr/ppp2ppp/2np4/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 d6",
    triggerMove: "d4",
    triggerFen: "r1bqkbnr/ppp2ppp/2np4/1B2p3/3PP3/5N2/PPP2PPP/RNBQK2R b KQkq d3 0 4",
    refutationMoves: [
      { move: "exd4", fen: "r1bqkbnr/ppp2ppp/2np4/1B6/3pP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5" },
      { move: "Nxd4", fen: "r1bqkbnr/ppp2ppp/2np4/1B6/3NP3/8/PPP2PPP/RNBQK2R b KQkq - 0 5" },
      { move: "Bd7", fen: "r2qkbnr/pppb1ppp/2np4/1B6/3NP3/8/PPP2PPP/RNBQK2R w KQkq - 1 6" },
      { move: "Nxc6", fen: "r2qkbnr/pppb1ppp/2Np4/1B6/4P3/8/PPP2PPP/RNBQK2R b KQkq - 0 6" },
      { move: "bxc6", fen: "r2qkbnr/p1pb1ppp/2pp4/1B6/4P3/8/PPP2PPP/RNBQK2R w KQkq - 0 7" },
      { move: "Bd3", fen: "r2qkbnr/p1pb1ppp/2pp4/8/4P3/3B4/PPP2PPP/RNBQK2R b KQkq - 1 7", annotation: "Looks safe but..." },
      { move: "c5", fen: "r2qkbnr/p1pb1ppp/2p5/2p5/4P3/3B4/PPP2PPP/RNBQK2R w KQkq c6 0 8" },
      { move: "c4", fen: "r2qkbnr/p1pb1ppp/2p5/2p5/2P1P3/3B4/PP3PPP/RNBQK2R b KQkq c3 0 8" },
      { move: "Qg5", fen: "r3kbnr/p1pb1ppp/2p5/2p3q1/2P1P3/3B4/PP3PPP/RNBQK2R w KQkq - 1 9", annotation: "Attacks g2 and threatens Qxg2" },
      { move: "Qf3", fen: "r3kbnr/p1pb1ppp/2p5/2p3q1/2P1P3/3B1Q2/PP3PPP/RNB1K2R b KQkq - 2 9" },
      { move: "Qxg2", fen: "r3kbnr/p1pb1ppp/2p5/2p5/2P1P3/3B1Q2/PP3PqP/RNB1K2R w KQkq - 0 10", annotation: "Black wins the g2 pawn with attack" }
    ],
    benefitsColor: "black",
    eco: "C62",
    openingName: "Ruy Lopez",
    variationName: "Old Steinitz Defense, Bernstein Trap",
    explanation: "In the Old Steinitz Defense (3...d6), if White plays too aggressively with d4 and follows up carelessly, Black can generate a powerful attack with Qg5! targeting g2 and creating threats.",
    keyIdea: "Queen to g5 creates threats on g2 and opens attacking lines",
    commonMistake: "White plays d4 and Nxc6 without adequate king safety",
    difficulty: "intermediate",
    trapType: "tactical",
    frequency: "occasional",
    tags: ["ruy lopez", "steinitz defense", "bernstein", "queen attack"]
  },
  {
    name: "Bird's Defense Trap",
    description: "A devastating trap in the Ruy Lopez Bird's Defense leading to a beautiful smothered mate.",
    setupFen: "r1bqk1nr/pppp1ppp/8/2b1p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 5",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nd4 4. Bc4 Bc5",
    triggerMove: "Nxe5",
    triggerFen: "r1bqk1nr/pppp1ppp/8/2b1N3/2BnP3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5",
    refutationMoves: [
      { move: "Qg5", fen: "r1b1k1nr/pppp1ppp/8/2b1N1q1/2BnP3/8/PPPP1PPP/RNBQK2R w KQkq - 1 6", annotation: "The Trap! Black ignores f7 and attacks g2 and the knight" },
      { move: "Nxf7", fen: "r1b1k1nr/pppp1Npp/8/2b3q1/2BnP3/8/PPPP1PPP/RNBQK2R b KQkq - 0 6", annotation: "White forks king and rook" },
      { move: "Qxg2", fen: "r1b1k1nr/pppp1Npp/8/2b5/2BnP3/8/PPPP1PqP/RNBQK2R w KQkq - 0 7", annotation: "Black takes g2!" },
      { move: "Rf1", fen: "r1b1k1nr/pppp1Npp/8/2b5/2BnP3/8/PPPP1PqP/RNBQKR2 b Qkq - 1 7", annotation: "White defends f2" },
      { move: "Qxe4+", fen: "r1b1k1nr/pppp1Npp/8/2b5/2Bnq3/8/PPPP1P1P/RNBQKR2 w Qkq - 0 8", annotation: "Check! Queen takes e4" },
      { move: "Be2", fen: "r1b1k1nr/pppp1Npp/8/2b5/3nq3/8/PPPPBP1P/RNBQKR2 b Qkq - 1 8", annotation: "White blocks with bishop" },
      { move: "Nf3#", fen: "r1b1k1nr/pppp1Npp/8/2b5/4q3/5n2/PPPPBP1P/RNBQKR2 w Qkq - 2 9", annotation: "Smothered Mate! White's pieces block all escape squares" }
    ],
    benefitsColor: "black",
    eco: "C61",
    openingName: "Ruy Lopez",
    variationName: "Bird's Defense",
    explanation: "In Bird's Defense (3...Nd4), if White retreats the bishop to c4 instead of taking the knight, and then plays the greedy Nxe5, Black unleashes Qg5! attacking both g2 and the knight. After Nxf7 Qxg2 Rf1 Qxe4+ Be2, the knight delivers a stunning smothered mate with Nf3#!",
    keyIdea: "Qg5 attacks g2 and the knight, leading to smothered mate after Nf3#",
    commonMistake: "White plays Nxe5 thinking they're winning a pawn, missing the mating attack",
    difficulty: "intermediate",
    trapType: "mating",
    frequency: "occasional",
    tags: ["ruy lopez", "bird's defense", "smothered mate", "queen attack"]
  },
  {
    name: "Dresden Trap",
    description: "Also known as the Second Tarrasch Trap, this occurs in the Steinitz Defense where White wins a pawn by force.",
    setupFen: "r2qk2r/pppbbppp/2np1n2/1B2p3/3PP3/2N2N2/PPP2PPP/R1BQR1K1 b kq - 5 7",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 Bd7 5. Nc3 Nf6 6. O-O Be7 7. Re1",
    triggerMove: "O-O",
    triggerFen: "r2q1rk1/pppbbppp/2np1n2/1B2p3/3PP3/2N2N2/PPP2PPP/R1BQR1K1 w - - 6 8",
    refutationMoves: [
      { move: "Bxc6", fen: "r2q1rk1/pppBbppp/2np1n2/4p3/3PP3/2N2N2/PPP2PPP/R1BQR1K1 b - - 0 8", annotation: "Exchanging the bishop" },
      { move: "Bxc6", fen: "r2q1rk1/ppp1bppp/2bp1n2/4p3/3PP3/2N2N2/PPP2PPP/R1BQR1K1 w - - 0 9" },
      { move: "dxe5", fen: "r2q1rk1/ppp1bppp/2bp1n2/4P3/4P3/2N2N2/PPP2PPP/R1BQR1K1 b - - 0 9", annotation: "Opening the d-file" },
      { move: "dxe5", fen: "r2q1rk1/ppp1bppp/2b2n2/4p3/4P3/2N2N2/PPP2PPP/R1BQR1K1 w - - 0 10" },
      { move: "Qxd8", fen: "r2Q1rk1/ppp1bppp/2b2n2/4p3/4P3/2N2N2/PPP2PPP/R1B1R1K1 b - - 0 10", annotation: "Exchanging queens" },
      { move: "Raxd8", fen: "3r1rk1/ppp1bppp/2b2n2/4p3/4P3/2N2N2/PPP2PPP/R1B1R1K1 w - - 0 11" },
      { move: "Nxe5", fen: "3r1rk1/ppp1bppp/2b2n2/4N3/4P3/2N5/PPP2PPP/R1B1R1K1 b - - 0 11", annotation: "The Dresden Trap! White wins a pawn" }
    ],
    benefitsColor: "white",
    eco: "C62",
    openingName: "Ruy Lopez",
    variationName: "Steinitz Defense, Dresden Trap",
    explanation: "In the Steinitz Defense after 3...d6, White plays 4.d4 and develops naturally. When Black castles on move 7, White executes the Dresden Trap: Bxc6, dxe5, Qxd8, and Nxe5 wins a clean pawn. If Black tries to recover the pawn, they lose the exchange or more material.",
    keyIdea: "Exchange on c6 and e5, then win the e5 pawn after queens are traded",
    commonMistake: "Black castles without seeing the forced pawn loss",
    difficulty: "intermediate",
    trapType: "material",
    frequency: "occasional",
    tags: ["ruy lopez", "steinitz defense", "dresden", "tarrasch", "pawn win"]
  },
  {
    name: "Cordel Trap",
    description: "A sharp trap in the Ruy Lopez Classical Defense where Black sacrifices material to hunt White's king.",
    setupFen: "r1bqkbnr/pppp1ppp/2n5/1Bb1p3/4P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 4",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 Bc5 4. c3",
    triggerMove: "f5",
    triggerFen: "r1bqkbnr/pppp2pp/2n5/1Bb1pp2/4P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq f6 0 5",
    refutationMoves: [
      { move: "d4", fen: "r1bqkbnr/pppp2pp/2n5/1Bb1pp2/3PP3/2P2N2/PP3PPP/RNBQK2R b KQkq d3 0 5", annotation: "White advances in the center" },
      { move: "fxe4", fen: "r1bqkbnr/pppp2pp/2n5/1Bb1p3/3Pp3/2P2N2/PP3PPP/RNBQK2R w KQkq - 0 6" },
      { move: "Nxe5", fen: "r1bqkbnr/pppp2pp/2n5/1Bb1N3/3Pp3/2P5/PP3PPP/RNBQK2R b KQkq - 0 6", annotation: "White takes the pawn" },
      { move: "Nxe5", fen: "r1bqkbnr/pppp2pp/8/1Bb1n3/3Pp3/2P5/PP3PPP/RNBQK2R w KQkq - 0 7" },
      { move: "dxe5", fen: "r1bqkbnr/pppp2pp/8/1Bb1P3/4p3/2P5/PP3PPP/RNBQK2R b KQkq - 0 7" },
      { move: "c6", fen: "r1bqkbnr/pp1p2pp/2p5/1Bb1P3/4p3/2P5/PP3PPP/RNBQK2R w KQkq - 0 8", annotation: "Attacking the bishop" },
      { move: "Bc4", fen: "r1bqkbnr/pp1p2pp/2p5/2b1P3/2B1p3/2P5/PP3PPP/RNBQK2R b KQkq - 1 8", annotation: "The trap is set!" },
      { move: "Qh4", fen: "r1b1kbnr/pp1p2pp/2p5/2b1P3/2B1p2q/2P5/PP3PPP/RNBQK2R w KQkq - 2 9", annotation: "Threatens Qxf2+ winning" },
      { move: "Qe2", fen: "r1b1kbnr/pp1p2pp/2p5/2b1P3/2B1p2q/2P5/PP2QPPP/RNB1K2R b KQkq - 3 9" },
      { move: "Qxe4", fen: "r1b1kbnr/pp1p2pp/2p5/2b1P3/2B1q3/2P5/PP2QPPP/RNB1K2R w KQkq - 0 10", annotation: "Black wins the e4 pawn with a strong attack" }
    ],
    benefitsColor: "black",
    eco: "C64",
    openingName: "Ruy Lopez",
    variationName: "Classical Defense, Cordel Gambit",
    explanation: "In the Classical Defense (3...Bc5), Black plays the sharp 4...f5 (Cordel Gambit). After White takes on e5, Black attacks the bishop with c6. If White retreats to c4, Qh4! creates strong threats. Black gets an excellent attack for minimal material.",
    keyIdea: "f5 gambit followed by Qh4 creates strong attacking chances",
    commonMistake: "White plays Bc4 allowing the powerful Qh4 attack",
    difficulty: "intermediate",
    trapType: "tactical",
    frequency: "occasional",
    tags: ["ruy lopez", "classical defense", "cordel gambit", "king attack", "gambit"]
  },
  {
    name: "Riga Trap",
    description: "A famous trap in the Ruy Lopez Open Defense where Black sacrifices the bishop on h2 to force a perpetual check, saving a lost position.",
    setupFen: "r1bqk2r/1pp2ppp/p1nb4/3p4/3Nn3/8/PPP2PPP/RNBQR1K1 w kq - 2 9",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 exd4 7. Re1 d5 8. Nxd4 Bd6",
    triggerMove: "Nxc6",
    triggerFen: "r1bqk2r/1pp2ppp/p1Nb4/3p4/4n3/8/PPP2PPP/RNBQR1K1 b kq - 0 9",
    refutationMoves: [
      { move: "Bxh2+", fen: "r1bqk2r/1pp2ppp/p1N5/3p4/4n3/8/PPP2PbP/RNBQR1K1 w kq - 0 10", annotation: "The stunning bishop sacrifice!" },
      { move: "Kxh2", fen: "r1bqk2r/1pp2ppp/p1N5/3p4/4n3/8/PPP2PPK/RNBQR3 b kq - 0 10", annotation: "Forced - King takes bishop" },
      { move: "Qh4+", fen: "r1b1k2r/1pp2ppp/p1N5/3p4/4n2q/8/PPP2PPK/RNBQR3 w kq - 1 11", annotation: "Check! The king is exposed" },
      { move: "Kg1", fen: "r1b1k2r/1pp2ppp/p1N5/3p4/4n2q/8/PPP2PP1/RNBQR1K1 b kq - 2 11" },
      { move: "Qxf2+", fen: "r1b1k2r/1pp2ppp/p1N5/3p4/4n3/8/PPP2qP1/RNBQR1K1 w kq - 0 12", annotation: "Taking f2 with check!" },
      { move: "Kh2", fen: "r1b1k2r/1pp2ppp/p1N5/3p4/4n3/8/PPP2qPK/RNBQR3 b kq - 1 12" },
      { move: "Qh4+", fen: "r1b1k2r/1pp2ppp/p1N5/3p4/4n2q/8/PPP3PK/RNBQR3 w kq - 2 13", annotation: "Perpetual check! Black draws from a losing position" }
    ],
    benefitsColor: "black",
    eco: "C80",
    openingName: "Ruy Lopez",
    variationName: "Open Defense, Riga Variation",
    explanation: "In the Open Defense, after 8...Bd6 Black sets a clever trap. If White greedily captures 9.Nxc6??, Black unleashes 9...Bxh2+! sacrificing the bishop. After Kxh2 Qh4+ Kg1 Qxf2+ Kh2 Qh4+, Black forces a perpetual check draw - a great escape from what looked like a losing position!",
    keyIdea: "Bishop sacrifice on h2 forces perpetual check, saving Black from material loss",
    commonMistake: "White plays Nxc6 thinking they're winning material, missing the perpetual check resource",
    difficulty: "intermediate",
    trapType: "tactical",
    frequency: "occasional",
    tags: ["ruy lopez", "open defense", "riga variation", "bishop sacrifice", "perpetual check"]
  }
];

async function seedAdditionalTraps() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCount = await TrapModel.countDocuments();
    console.log(`Current trap count: ${existingCount}`);

    // Check for --update flag to update existing traps (PGN only)
    const shouldUpdate = process.argv.includes('--update');
    // Check for --full-update flag to replace entire trap documents
    const shouldFullUpdate = process.argv.includes('--full-update');

    if (shouldFullUpdate) {
      console.log(`Full update: Replacing ${additionalTraps.length} traps...`);
      for (const trap of additionalTraps) {
        try {
          const result = await TrapModel.findOneAndUpdate(
            { name: trap.name },
            { $set: trap },
            { new: true, upsert: false }
          );
          if (result) {
            console.log(`  ✓ Replaced: ${trap.name}`);
          } else {
            console.log(`  - Not found: ${trap.name}`);
          }
        } catch (err: any) {
          console.error(`  ✗ Error replacing ${trap.name}:`, err.message);
        }
      }
      console.log('\nFull update complete.');
    } else if (shouldUpdate) {
      console.log(`Updating ${additionalTraps.length} traps with PGN data...`);
      for (const trap of additionalTraps) {
        try {
          const result = await TrapModel.findOneAndUpdate(
            { name: trap.name },
            { $set: { pgn: trap.pgn } },
            { new: true }
          );
          if (result) {
            console.log(`  ✓ Updated: ${trap.name} (pgn: ${trap.pgn})`);
          } else {
            console.log(`  - Not found: ${trap.name}`);
          }
        } catch (err: any) {
          console.error(`  ✗ Error updating ${trap.name}:`, err.message);
        }
      }
      console.log('\nUpdate complete.');
    } else {
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
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding traps:', error);
    process.exit(1);
  }
}

seedAdditionalTraps();
