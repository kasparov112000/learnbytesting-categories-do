import { Schema, model } from 'mongoose';

export interface IExpertiseLevel {
  _id?: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  rootCategoryId: string;
  subscribedCategoryIds: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExpertiseLevelSchema = new Schema<IExpertiseLevel>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'school' },
    order: { type: Number, default: 0 },
    rootCategoryId: { type: String, required: true, index: true },
    subscribedCategoryIds: [{ type: String }],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: 'expertise_levels'
  }
);

ExpertiseLevelSchema.index({ rootCategoryId: 1, isActive: 1 });
ExpertiseLevelSchema.index({ rootCategoryId: 1, order: 1 });

export const ExpertiseLevelModel = model<IExpertiseLevel>('ExpertiseLevel', ExpertiseLevelSchema);

export class ExpertiseLevel implements IExpertiseLevel {
  _id?: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  rootCategoryId: string;
  subscribedCategoryIds: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IExpertiseLevel>) {
    this._id = data._id;
    this.name = data.name || '';
    this.description = data.description || '';
    this.icon = data.icon || 'school';
    this.order = data.order || 0;
    this.rootCategoryId = data.rootCategoryId || '';
    this.subscribedCategoryIds = data.subscribedCategoryIds || [];
    this.isDefault = data.isDefault || false;
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
