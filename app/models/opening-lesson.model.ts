import { Schema, model } from 'mongoose';

/**
 * Opening Lesson Model
 *
 * Stores multiple lessons per opening, categorized by difficulty.
 * Each lesson contains a PGN sequence for guided practice.
 */

export interface IOpeningLesson {
  _id?: string;
  eco: string;              // e.g. "C50"
  openingName: string;      // e.g. "Italian Game"
  variationName?: string;   // e.g. "Giuoco Piano" (optional — for variation-specific lessons)
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;            // e.g. "Italian Game: Core Moves"
  description?: string;     // Brief description of what this lesson teaches
  pgn: string;              // The move sequence for this lesson
  moveCount: number;        // Pre-computed number of moves
  order: number;            // Sort order within same eco+difficulty
  isActive: boolean;        // Soft-delete / draft support

  createdAt?: Date;
  updatedAt?: Date;
}

const OpeningLessonSchema = new Schema<IOpeningLesson>(
  {
    eco: { type: String, required: true, index: true },
    openingName: { type: String, required: true, index: true },
    variationName: { type: String },

    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },

    title: { type: String, required: true },
    description: { type: String },
    pgn: { type: String, required: true },
    moveCount: { type: Number, required: true, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'opening_lessons'
  }
);

// Compound indexes for efficient querying
OpeningLessonSchema.index({ eco: 1, difficulty: 1, order: 1 });
OpeningLessonSchema.index({ eco: 1, isActive: 1 });
OpeningLessonSchema.index({ openingName: 1, isActive: 1 });

export const OpeningLessonModel = model<IOpeningLesson>('OpeningLesson', OpeningLessonSchema);

export class OpeningLesson implements IOpeningLesson {
  _id?: string;
  eco: string;
  openingName: string;
  variationName?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description?: string;
  pgn: string;
  moveCount: number;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IOpeningLesson>) {
    this._id = data._id;
    this.eco = data.eco || '';
    this.openingName = data.openingName || '';
    this.variationName = data.variationName;
    this.difficulty = data.difficulty || 'beginner';
    this.title = data.title || '';
    this.description = data.description;
    this.pgn = data.pgn || '';
    this.moveCount = data.moveCount || 0;
    this.order = data.order || 0;
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
