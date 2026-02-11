import { Schema } from 'mongoose';

export interface TrapMove {
  move: string;
  fen: string;
  annotation?: string;
}

export interface ITrap {
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
}

const TrapMoveSchema = new Schema({
  move: { type: String, required: true },
  fen: { type: String, required: true },
  annotation: { type: String },
}, { _id: false });

export const TrapSchema = new Schema<ITrap>({
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  setupFen: { type: String, required: true },
  triggerMove: { type: String, required: true },
  triggerFen: { type: String, required: true },
  refutationMoves: [TrapMoveSchema],
  benefitsColor: { type: String, enum: ['white', 'black'], required: true },
  categoryId: { type: String, index: true },
  eco: { type: String, index: true },
  openingName: { type: String },
  variationName: { type: String },
  explanation: { type: String, required: true },
  keyIdea: { type: String, required: true },
  commonMistake: { type: String },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  trapType: {
    type: String,
    enum: ['tactical', 'positional', 'material', 'mating'],
    default: 'tactical',
  },
  frequency: {
    type: String,
    enum: ['common', 'occasional', 'rare'],
    default: 'occasional',
  },
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  pgn: { type: String },
}, {
  timestamps: true,
  collection: 'traps',
});

TrapSchema.index({ setupFen: 1 });
TrapSchema.index({ triggerFen: 1 });
TrapSchema.index({ eco: 1, isActive: 1 });
TrapSchema.index({ categoryId: 1, isActive: 1 });
TrapSchema.index({ name: 'text', description: 'text', openingName: 'text', keyIdea: 'text' });
