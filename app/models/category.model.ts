import { Schema, model, Document } from 'mongoose';

export interface ICategory {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createCreatedDate: Date;
  createUuid: string;
  children: ICategory[];
  parent?: string;
  $getAllSubdocs: () => any[];
  $isDeleted: () => boolean;
  $isSaved: () => boolean;
  $save: () => Promise<void>;
  $remove: () => Promise<void>;
}

const CategorySchema = new Schema<ICategory>(
  {
    _id: { type: Schema.Types.Mixed }, // Allow both String and ObjectId
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createCreatedDate: { type: Date, default: Date.now },
    createUuid: { type: String },
    children: [{ type: Schema.Types.Mixed }],
    parent: { type: String },
  },
  {
    timestamps: true,
    id: false // Disable virtual id getter
  }
);

// Create indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1 });

export const CategoryModel = model<ICategory>('Categories', CategorySchema);

export class Category implements ICategory {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createCreatedDate: Date;
  createUuid: string;
  children: Category[];
  parent?: string;

  constructor(data: Partial<ICategory>) {
    this._id = data._id || '';
    this.name = data.name || '';
    this.isActive = data.isActive || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createCreatedDate = data.createCreatedDate || new Date();
    this.createUuid = data.createUuid || '';
    this.children = (data.children || []).map(child => new Category(child));
    this.parent = data.parent;
  }

  $getAllSubdocs() {
    return [];
  }

  $isDeleted() {
    return false;
  }

  $isSaved() {
    return true;
  }

  async $save() {}

  async $remove() {}
} 