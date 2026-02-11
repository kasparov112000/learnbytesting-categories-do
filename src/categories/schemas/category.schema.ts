import { Schema } from 'mongoose';

// Interfaces (internalized from hipolito-models and local model)
export interface QuestionTypeConfig {
  type: string;
  displayName: string;
  isEnabled: boolean;
  visibleToChildren?: boolean;
}

export interface CustomFieldConfig {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'dropdown' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  options?: string[];
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

export interface FlashcardAiConfig {
  additionalPrompt?: string;
  defaultCategories?: string[];
  focusAreas?: string[];
  defaultDifficulty?: number;
}

export interface QuestionAiConfig {
  additionalPrompt?: string;
  defaultDifficulty?: string;
  focusArea?: string;
  questionTypes?: string[];
}

export interface TranscriptAiConfig {
  additionalPrompt?: string;
  extractionRules?: string[];
}

export interface CategoryGenerationConfig {
  instructions?: string;
  maxDepth?: number;
  suggestedStructure?: string;
}

export interface AiConfig {
  systemPrompt?: string;
  domainContext?: string;
  categoryGenerationConfig?: CategoryGenerationConfig;
  flashcardConfig?: FlashcardAiConfig;
  questionConfig?: QuestionAiConfig;
  transcriptConfig?: TranscriptAiConfig;
  inheritToChildren?: boolean;
}

export interface MenuItemConfig {
  key: string;
  displayName: string;
  isEnabled: boolean;
  icon?: string;
}

export interface CategoryTranslations {
  es?: string;
  pt?: string;
  fr?: string;
  de?: string;
}

export interface ICategory {
  _id: string;
  name: string;
  translations?: CategoryTranslations;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createCreatedDate: Date;
  createUuid: string;
  children: ICategory[];
  parent?: string;
  active?: boolean;
  createdDate?: Date;
  modifiedDate?: Date;
  createdByGuid?: string;
  modifiedByGuid?: string;
  allowedQuestionTypes?: QuestionTypeConfig[];
  customFields?: CustomFieldConfig[];
  aiConfig?: AiConfig;
  visibleMenuItems?: MenuItemConfig[];
}

export const CategorySchema = new Schema<ICategory>(
  {
    _id: { type: Schema.Types.Mixed },
    name: { type: String, required: true },
    translations: {
      es: { type: String },
      pt: { type: String },
      fr: { type: String },
      de: { type: String },
    },
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createCreatedDate: { type: Date, default: Date.now },
    createdDate: { type: Date },
    modifiedDate: { type: Date },
    createUuid: { type: String },
    createdByGuid: { type: String },
    modifiedByGuid: { type: String },
    children: [{ type: Schema.Types.Mixed }],
    parent: { type: String },
    allowedQuestionTypes: [
      {
        type: { type: String, required: true },
        displayName: { type: String, required: true },
        isEnabled: { type: Boolean, default: true },
        visibleToChildren: { type: Boolean, default: true },
      },
    ],
    customFields: [
      {
        name: { type: String, required: true },
        displayName: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: ['text', 'number', 'dropdown', 'textarea', 'checkbox', 'date'],
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
          maxLength: { type: Number },
        },
      },
    ],
    aiConfig: {
      systemPrompt: { type: String },
      domainContext: { type: String },
      categoryGenerationConfig: {
        instructions: { type: String },
        maxDepth: { type: Number, min: 2, max: 6, default: 4 },
        suggestedStructure: { type: String },
      },
      flashcardConfig: {
        additionalPrompt: { type: String },
        defaultCategories: [{ type: String }],
        focusAreas: [{ type: String }],
        defaultDifficulty: { type: Number, min: 1, max: 5 },
      },
      questionConfig: {
        additionalPrompt: { type: String },
        defaultDifficulty: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        focusArea: {
          type: String,
          enum: ['opening', 'middlegame', 'endgame', 'tactics', 'strategy', 'all'],
        },
        questionTypes: [{ type: String }],
      },
      transcriptConfig: {
        additionalPrompt: { type: String },
        extractionRules: [{ type: String }],
      },
      inheritToChildren: { type: Boolean, default: true },
    },
    visibleMenuItems: [
      {
        key: { type: String, required: true },
        displayName: { type: String, required: true },
        isEnabled: { type: Boolean, default: true },
        icon: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    id: false,
  },
);

// Indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1 });
