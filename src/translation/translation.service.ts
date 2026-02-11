import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    this.baseUrl = process.env.TRANSLATION_SERVICE_URL || 'http://localhost:3035';
  }

  async translate(text: string, source = 'en', target = 'es'): Promise<string> {
    if (!text) return text;
    if (source === target) return text;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/translate`, { text, source, target }),
      );
      return data.translated;
    } catch (error) {
      this.logger.error('Translation failed:', error.message);
      return text;
    }
  }

  async translateBatch(texts: string[], source = 'en', target = 'es'): Promise<string[]> {
    if (!texts || texts.length === 0) return texts;
    if (source === target) return texts;

    const nonEmptyIndices: number[] = [];
    const nonEmptyTexts: string[] = [];
    texts.forEach((t, i) => {
      if (t) {
        nonEmptyIndices.push(i);
        nonEmptyTexts.push(t);
      }
    });

    if (nonEmptyTexts.length === 0) return texts;

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/translate/batch`, {
          texts: nonEmptyTexts,
          source,
          target,
        }),
      );

      const result = [...texts];
      nonEmptyIndices.forEach((originalIdx, translatedIdx) => {
        result[originalIdx] = data.translations[translatedIdx];
      });
      return result;
    } catch (error) {
      this.logger.error('Batch translation failed:', error.message);
      return texts;
    }
  }

  async getCachedTranslation(
    contentId: string,
    contentType: string,
    targetLang: string,
  ): Promise<Record<string, any> | null> {
    try {
      const db = this.connection.useDb('translation');
      const collection = db.collection('content_translations');

      const cached = await collection.findOne({
        content_id: contentId,
        content_type: contentType,
        target_lang: targetLang,
        translation_status: 'complete',
      });

      if (cached) {
        collection.updateOne({ _id: cached._id }, { $inc: { access_count: 1 } }).catch(() => {});
        return cached.translated_fields;
      }

      return null;
    } catch (error) {
      this.logger.error('Cache lookup failed:', error.message);
      return null;
    }
  }

  async cacheTranslation(
    contentId: string,
    contentType: string,
    targetLang: string,
    translatedFields: Record<string, any>,
  ): Promise<void> {
    try {
      const db = this.connection.useDb('translation');
      const collection = db.collection('content_translations');

      await collection.updateOne(
        { content_id: contentId, content_type: contentType, target_lang: targetLang },
        {
          $set: {
            translated_fields: translatedFields,
            translation_source: 'api',
            translation_status: 'complete',
            source_lang: 'en',
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
            access_count: 0,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      this.logger.error('Failed to cache translation:', error.message);
    }
  }
}
