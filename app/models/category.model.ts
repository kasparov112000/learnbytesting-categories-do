import { Schema, model, Document } from 'mongoose';

export interface QuestionTypeConfig {
  type: string;
  displayName: string;
  isEnabled: boolean;
  visibleToChildren?: boolean; // Controls if this question type is inherited by child categories
}

export interface CustomFieldConfig {
  name: string;           // Field identifier (e.g., "eco", "opening_variation")
  displayName: string;    // Human-readable name (e.g., "ECO Code", "Opening Variation")
  type: 'text' | 'number' | 'dropdown' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  options?: string[];     // For dropdown type
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

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
  allowedQuestionTypes?: QuestionTypeConfig[];
  customFields?: CustomFieldConfig[];
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
    allowedQuestionTypes: [
      {
        type: { type: String, required: true },
        displayName: { type: String, required: true },
        isEnabled: { type: Boolean, default: true },
        visibleToChildren: { type: Boolean, default: true }
      }
    ],
    customFields: [
      {
        name: { type: String, required: true },
        displayName: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: ['text', 'number', 'dropdown', 'textarea', 'checkbox', 'date']
        },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
        placeholder: { type: String },
        helpText: { type: String },
        defaultValue: { type: Schema.Types.Mixed },
        validation: {
          min: { type: Number },
          max: { type: Number },
          pattern: { type: String },
          minLength: { type: Number },
          maxLength: { type: Number }
        }
      }
    ],
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
  allowedQuestionTypes?: QuestionTypeConfig[];
  customFields?: CustomFieldConfig[];

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
    this.allowedQuestionTypes = data.allowedQuestionTypes || [];
    this.customFields = data.customFields || [];
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