import axios, { AxiosInstance } from 'axios';
import * as mongoose from 'mongoose';

const TRANSLATION_SERVICE_URL = process.env.TRANSLATION_URL || 'http://localhost:3035';

export interface ContentTranslation {
  content_id: string;
  content_type: 'question' | 'flashcard' | 'category';
  source_lang: string;
  target_lang: string;
  translated_fields: Record<string, string>;
  translation_source: 'api' | 'glossary' | 'manual';
  translation_status: 'pending' | 'complete' | 'error';
  error_message?: string;
  created_at: Date;
  updated_at: Date;
  access_count: number;
}

export class TranslationApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: TRANSLATION_SERVICE_URL,
      timeout: 10000
    });
  }

  async translate(text: string, source: string = 'en', target: string = 'es'): Promise<string> {
    if (!text || source === target) return text;
    try {
      const response = await this.client.post('/translate', { text, source, target });
      return response.data.translated;
    } catch (error) {
      console.error('Translation failed:', error.message);
      return text;
    }
  }

  async translateBatch(texts: string[], source: string = 'en', target: string = 'es'): Promise<string[]> {
    if (!texts.length || source === target) return texts;
    const nonEmptyTexts = texts.filter(t => t);
    if (!nonEmptyTexts.length) return texts;
    try {
      const response = await this.client.post('/translate/batch', { texts: nonEmptyTexts, source, target });
      let resultIndex = 0;
      return texts.map(original => !original ? original : response.data.translations[resultIndex++]);
    } catch (error) {
      console.error('Batch translation failed:', error.message);
      return texts;
    }
  }

  async getCachedTranslation(contentId: string, contentType: string, targetLang: string): Promise<Record<string, string> | null> {
    try {
      const translationDb = mongoose.connection.useDb('translation');
      const cached = await translationDb.collection('content_translations').findOne({
        content_id: contentId,
        content_type: contentType,
        target_lang: targetLang,
        translation_status: 'complete'
      });
      if (cached) {
        translationDb.collection('content_translations').updateOne(
          { _id: cached._id },
          { $inc: { access_count: 1 } }
        ).catch(() => {});
        return cached.translated_fields;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async cacheTranslation(contentId: string, contentType: string, targetLang: string, translatedFields: Record<string, string>): Promise<void> {
    try {
      const translationDb = mongoose.connection.useDb('translation');
      await translationDb.collection('content_translations').updateOne(
        { content_id: contentId, content_type: contentType, target_lang: targetLang },
        {
          $set: { translated_fields: translatedFields, translation_source: 'api', translation_status: 'complete', updated_at: new Date(), source_lang: 'en' },
          $setOnInsert: { created_at: new Date(), access_count: 0 }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to cache translation:', error.message);
    }
  }
}

export const translationClient = new TranslationApiClient();
