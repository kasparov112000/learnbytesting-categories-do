import { Schema } from 'mongoose';

export interface IExpertiseLevel {
  _id?: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  rootCategoryId: string;
  subscribedCategoryIds: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ExpertiseLevelSchema = new Schema<IExpertiseLevel>({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  order: { type: Number, default: 0 },
  rootCategoryId: { type: String, required: true, index: true },
  subscribedCategoryIds: [{ type: String }],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'expertise_levels',
});

ExpertiseLevelSchema.index({ rootCategoryId: 1, isActive: 1 });
ExpertiseLevelSchema.index({ rootCategoryId: 1, order: 1 });
