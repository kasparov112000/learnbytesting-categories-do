import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { getConnectionToken } from '@nestjs/mongoose';
import { of, throwError } from 'rxjs';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpService: { post: jest.Mock };
  let mockCollection: {
    findOne: jest.Mock;
    updateOne: jest.Mock;
  };
  let mockDb: { collection: jest.Mock };
  let mockConnection: { useDb: jest.Mock };

  beforeEach(async () => {
    mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    mockConnection = {
      useDb: jest.fn().mockReturnValue(mockDb),
    };

    httpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        { provide: HttpService, useValue: httpService },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // translate()
  // =========================================================================
  describe('translate()', () => {
    it('should translate text successfully', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translated: 'texto traducido' } }),
      );

      const result = await service.translate('translated text', 'en', 'es');

      expect(result).toBe('texto traducido');
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/translate'),
        { text: 'translated text', source: 'en', target: 'es' },
      );
    });

    it('should return original text on HTTP error', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const result = await service.translate('hello', 'en', 'es');

      expect(result).toBe('hello');
    });

    it('should skip translation when source equals target', async () => {
      const result = await service.translate('hello', 'en', 'en');

      expect(result).toBe('hello');
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should return empty string when text is empty', async () => {
      const result = await service.translate('', 'en', 'es');

      expect(result).toBe('');
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should return null/undefined when text is null or undefined', async () => {
      const resultNull = await service.translate(null as any, 'en', 'es');
      expect(resultNull).toBeNull();
      expect(httpService.post).not.toHaveBeenCalled();

      const resultUndefined = await service.translate(undefined as any, 'en', 'es');
      expect(resultUndefined).toBeUndefined();
    });

    it('should use default source "en" and target "es" when not specified', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translated: 'hola' } }),
      );

      await service.translate('hello');

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        { text: 'hello', source: 'en', target: 'es' },
      );
    });

    it('should call the correct translation service URL', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translated: 'bonjour' } }),
      );

      await service.translate('hello', 'en', 'fr');

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/translate$/),
        expect.objectContaining({ text: 'hello' }),
      );
    });

    it('should handle translation service returning unexpected data gracefully', async () => {
      httpService.post.mockReturnValue(
        of({ data: {} }),
      );

      const result = await service.translate('hello', 'en', 'es');

      expect(result).toBeUndefined();
    });
  });

  // =========================================================================
  // translateBatch()
  // =========================================================================
  describe('translateBatch()', () => {
    it('should translate an array of texts successfully', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translations: ['hola', 'mundo'] } }),
      );

      const result = await service.translateBatch(['hello', 'world'], 'en', 'es');

      expect(result).toEqual(['hola', 'mundo']);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/translate/batch'),
        { texts: ['hello', 'world'], source: 'en', target: 'es' },
      );
    });

    it('should return original array on HTTP error', async () => {
      httpService.post.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );

      const input = ['hello', 'world'];
      const result = await service.translateBatch(input, 'en', 'es');

      expect(result).toEqual(['hello', 'world']);
    });

    it('should skip translation when source equals target', async () => {
      const input = ['hello', 'world'];
      const result = await service.translateBatch(input, 'en', 'en');

      expect(result).toEqual(['hello', 'world']);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should return the input when texts array is empty', async () => {
      const result = await service.translateBatch([], 'en', 'es');

      expect(result).toEqual([]);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should return the input when texts is null or undefined', async () => {
      const resultNull = await service.translateBatch(null as any, 'en', 'es');
      expect(resultNull).toBeNull();

      const resultUndefined = await service.translateBatch(undefined as any, 'en', 'es');
      expect(resultUndefined).toBeUndefined();
    });

    it('should handle empty items within the array by skipping them', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translations: ['hola', 'mundo'] } }),
      );

      const input = ['hello', '', 'world', null as any];
      const result = await service.translateBatch(input, 'en', 'es');

      // Only non-empty texts ('hello', 'world') should be sent for translation
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/translate/batch'),
        { texts: ['hello', 'world'], source: 'en', target: 'es' },
      );

      // Empty items stay in place, non-empty get translated
      expect(result[0]).toBe('hola');
      expect(result[1]).toBe('');
      expect(result[2]).toBe('mundo');
      expect(result[3]).toBeNull();
    });

    it('should return original array when all items are empty/falsy', async () => {
      const input = ['', null as any, undefined as any];
      const result = await service.translateBatch(input, 'en', 'es');

      expect(result).toEqual(input);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should use default source "en" and target "es" when not specified', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translations: ['hola'] } }),
      );

      await service.translateBatch(['hello']);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        { texts: ['hello'], source: 'en', target: 'es' },
      );
    });

    it('should preserve array order when mixing empty and non-empty items', async () => {
      httpService.post.mockReturnValue(
        of({ data: { translations: ['B-translated', 'D-translated'] } }),
      );

      const input = ['', 'B', '', 'D', ''];
      const result = await service.translateBatch(input, 'en', 'fr');

      expect(result).toEqual(['', 'B-translated', '', 'D-translated', '']);
    });
  });

  // =========================================================================
  // getCachedTranslation()
  // =========================================================================
  describe('getCachedTranslation()', () => {
    it('should return cached translated_fields when found', async () => {
      const cachedDoc = {
        _id: 'abc123',
        translated_fields: { title: 'titulo', description: 'descripcion' },
      };
      mockCollection.findOne.mockResolvedValue(cachedDoc);

      const result = await service.getCachedTranslation('content1', 'category', 'es');

      expect(result).toEqual({ title: 'titulo', description: 'descripcion' });
      expect(mockConnection.useDb).toHaveBeenCalledWith('translation');
      expect(mockDb.collection).toHaveBeenCalledWith('content_translations');
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        content_id: 'content1',
        content_type: 'category',
        target_lang: 'es',
        translation_status: 'complete',
      });
    });

    it('should return null when no cached translation is found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await service.getCachedTranslation('content1', 'category', 'es');

      expect(result).toBeNull();
    });

    it('should increment access_count when a cached translation is found', async () => {
      const cachedDoc = {
        _id: 'abc123',
        translated_fields: { title: 'titulo' },
      };
      mockCollection.findOne.mockResolvedValue(cachedDoc);
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.getCachedTranslation('content1', 'category', 'es');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { _id: 'abc123' },
        { $inc: { access_count: 1 } },
      );
    });

    it('should not increment access_count when no cached translation is found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await service.getCachedTranslation('content1', 'category', 'es');

      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should return null when findOne throws an error', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('DB connection lost'));

      const result = await service.getCachedTranslation('content1', 'category', 'es');

      expect(result).toBeNull();
    });

    it('should still return cached data even if access_count update fails', async () => {
      const cachedDoc = {
        _id: 'abc123',
        translated_fields: { title: 'titulo' },
      };
      mockCollection.findOne.mockResolvedValue(cachedDoc);
      // updateOne returns a rejected promise, but the code does .catch(() => {})
      mockCollection.updateOne.mockRejectedValue(new Error('Update failed'));

      const result = await service.getCachedTranslation('content1', 'category', 'es');

      expect(result).toEqual({ title: 'titulo' });
    });
  });

  // =========================================================================
  // cacheTranslation()
  // =========================================================================
  describe('cacheTranslation()', () => {
    it('should upsert with correct $set and $setOnInsert fields', async () => {
      const translatedFields = { title: 'titulo', description: 'descripcion' };

      await service.cacheTranslation('content1', 'category', 'es', translatedFields);

      expect(mockConnection.useDb).toHaveBeenCalledWith('translation');
      expect(mockDb.collection).toHaveBeenCalledWith('content_translations');
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { content_id: 'content1', content_type: 'category', target_lang: 'es' },
        {
          $set: {
            translated_fields: translatedFields,
            translation_source: 'api',
            translation_status: 'complete',
            source_lang: 'en',
            updated_at: expect.any(Date),
          },
          $setOnInsert: {
            created_at: expect.any(Date),
            access_count: 0,
          },
        },
        { upsert: true },
      );
    });

    it('should call updateOne with upsert: true', async () => {
      await service.cacheTranslation('id1', 'type1', 'fr', { name: 'nom' });

      const callArgs = mockCollection.updateOne.mock.calls[0];
      expect(callArgs[2]).toEqual({ upsert: true });
    });

    it('should handle errors gracefully without throwing', async () => {
      mockCollection.updateOne.mockRejectedValue(new Error('DB write failed'));

      // Should not throw
      await expect(
        service.cacheTranslation('id1', 'type1', 'es', { title: 'titulo' }),
      ).resolves.toBeUndefined();
    });

    it('should use the translation database and content_translations collection', async () => {
      await service.cacheTranslation('id1', 'type1', 'de', { title: 'Titel' });

      expect(mockConnection.useDb).toHaveBeenCalledWith('translation');
      expect(mockDb.collection).toHaveBeenCalledWith('content_translations');
    });

    it('should set translation_source to "api" and translation_status to "complete"', async () => {
      await service.cacheTranslation('id1', 'type1', 'pt', { title: 'titulo' });

      const updateArg = mockCollection.updateOne.mock.calls[0][1];
      expect(updateArg.$set.translation_source).toBe('api');
      expect(updateArg.$set.translation_status).toBe('complete');
    });

    it('should set source_lang to "en"', async () => {
      await service.cacheTranslation('id1', 'type1', 'ja', { title: 'taito' });

      const updateArg = mockCollection.updateOne.mock.calls[0][1];
      expect(updateArg.$set.source_lang).toBe('en');
    });

    it('should initialize access_count to 0 on insert', async () => {
      await service.cacheTranslation('id1', 'type1', 'ko', { title: 'jemok' });

      const updateArg = mockCollection.updateOne.mock.calls[0][1];
      expect(updateArg.$setOnInsert.access_count).toBe(0);
    });
  });
});
