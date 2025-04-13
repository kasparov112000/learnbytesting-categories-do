import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: ICategory[];
  active?: boolean;
  createUuid?: string;
  parent?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  createCreatedDate?: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    parentId: { type: String },
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    createUuid: { type: String },
    parent: { type: String },
    children: [{ type: Schema.Types.Mixed }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
    createCreatedDate: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    _id: false, // Disable automatic _id generation
    id: false // Disable virtual id getter
  }
);

// Create indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });

export const Category = model<ICategory>('Categories', CategorySchema); 