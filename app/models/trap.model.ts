import { Schema, model, Document } from 'mongoose';

/**
 * Chess Opening Trap Model
 *
 * Stores opening traps that can be linked to categories (openings/variations)
 * Used during opening practice to warn users about common traps
 */

export interface TrapMove {
  move: string;           // SAN notation (e.g., "Nxe5")
  fen: string;            // FEN after this move
  annotation?: string;    // Optional annotation for this move
}

export interface ITrap {
  _id?: string;
  name: string;                    // e.g., "Fishing Pole Trap"
  description: string;             // Brief description of the trap

  // Chess position data
  setupFen: string;                // FEN position where trap can be sprung
  triggerMove: string;             // The move that falls into the trap (SAN)
  triggerFen: string;              // FEN after the trigger move
  refutationMoves: TrapMove[];     // The punishing sequence

  // Which side benefits from the trap
  benefitsColor: 'white' | 'black';

  // Category/Opening linkage
  categoryId?: string;             // Reference to category _id
  eco?: string;                    // ECO code (e.g., "C65")
  openingName?: string;            // e.g., "Ruy Lopez, Berlin Defense"
  variationName?: string;          // Specific variation name

  // Educational content
  explanation: string;             // Why this is a trap, what's the idea
  keyIdea: string;                 // Short tactical/strategic idea
  commonMistake?: string;          // What beginners often play wrong

  // Classification
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  trapType: 'tactical' | 'positional' | 'material' | 'mating';
  frequency: 'common' | 'occasional' | 'rare';

  // Metadata
  tags: string[];
  isActive: boolean;

  // PGN for full game/line demonstration
  pgn?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

const TrapMoveSchema = new Schema({
  move: { type: String, required: true },
  fen: { type: String, required: true },
  annotation: { type: String }
}, { _id: false });

const TrapSchema = new Schema<ITrap>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String, required: true },

    // Chess position data
    setupFen: { type: String, required: true, index: true },
    triggerMove: { type: String, required: true },
    triggerFen: { type: String, required: true, index: true },
    refutationMoves: [TrapMoveSchema],

    // Which side benefits
    benefitsColor: {
      type: String,
      required: true,
      enum: ['white', 'black']
    },

    // Category linkage
    categoryId: { type: String, index: true },
    eco: { type: String, index: true },
    openingName: { type: String, index: true },
    variationName: { type: String },

    // Educational content
    explanation: { type: String, required: true },
    keyIdea: { type: String, required: true },
    commonMistake: { type: String },

    // Classification
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    trapType: {
      type: String,
      required: true,
      enum: ['tactical', 'positional', 'material', 'mating'],
      default: 'tactical'
    },
    frequency: {
      type: String,
      required: true,
      enum: ['common', 'occasional', 'rare'],
      default: 'occasional'
    },

    // Metadata
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },

    // Full PGN
    pgn: { type: String }
  },
  {
    timestamps: true,
    collection: 'traps'
  }
);

// Compound indexes for efficient querying
TrapSchema.index({ eco: 1, isActive: 1 });
TrapSchema.index({ categoryId: 1, isActive: 1 });
TrapSchema.index({ setupFen: 1, benefitsColor: 1 });
TrapSchema.index({ difficulty: 1, frequency: 1 });
TrapSchema.index({ tags: 1 });

export const TrapModel = model<ITrap>('Trap', TrapSchema);

export class Trap implements ITrap {
  _id?: string;
  name: string;
  description: string;
  setupFen: string;
  triggerMove: string;
  triggerFen: string;
  refutationMoves: TrapMove[];
  benefitsColor: 'white' | 'black';
  categoryId?: string;
  eco?: string;
  openingName?: string;
  variationName?: string;
  explanation: string;
  keyIdea: string;
  commonMistake?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  trapType: 'tactical' | 'positional' | 'material' | 'mating';
  frequency: 'common' | 'occasional' | 'rare';
  tags: string[];
  isActive: boolean;
  pgn?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<ITrap>) {
    this._id = data._id;
    this.name = data.name || '';
    this.description = data.description || '';
    this.setupFen = data.setupFen || '';
    this.triggerMove = data.triggerMove || '';
    this.triggerFen = data.triggerFen || '';
    this.refutationMoves = data.refutationMoves || [];
    this.benefitsColor = data.benefitsColor || 'white';
    this.categoryId = data.categoryId;
    this.eco = data.eco;
    this.openingName = data.openingName;
    this.variationName = data.variationName;
    this.explanation = data.explanation || '';
    this.keyIdea = data.keyIdea || '';
    this.commonMistake = data.commonMistake;
    this.difficulty = data.difficulty || 'intermediate';
    this.trapType = data.trapType || 'tactical';
    this.frequency = data.frequency || 'occasional';
    this.tags = data.tags || [];
    this.isActive = data.isActive !== false;
    this.pgn = data.pgn;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
