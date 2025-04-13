import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    parentId: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    _id: false // Disable automatic _id generation
  }
);

// Create indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });

export const Category = model<ICategory>('Categories', CategorySchema); 