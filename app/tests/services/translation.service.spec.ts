const mockPost = jest.fn();
const mockCreate = jest.fn(() => ({
  post: mockPost
}));
jest.mock('axios', () => {
  const axiosMock: any = { create: mockCreate };
  axiosMock.default = axiosMock;
  axiosMock.__esModule = true;
  return axiosMock;
});

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue({});
const mockCollection = jest.fn().mockReturnValue({
  findOne: mockFindOne,
  updateOne: mockUpdateOne
});
const mockUseDb = jest.fn().mockReturnValue({
  collection: mockCollection
});
jest.mock('mongoose', () => {
  const mongooseMock: any = {
    connection: {
      useDb: mockUseDb
    }
  };
  mongooseMock.__esModule = true;
  mongooseMock.default = mongooseMock;
  return mongooseMock;
});

import { TranslationApiClient } from '../../services/translation.service';
import axios from 'axios';
import * as mongoose from 'mongoose';

describe('TranslationApiClient', () => {
  let client: TranslationApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    client = new TranslationApiClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create an axios instance with default base URL and timeout', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000
      });
    });
  });

  // ---------------------------------------------------------------
  // translate()
  // ---------------------------------------------------------------
  describe('translate', () => {
    it('should POST to /translate and return translated text', async () => {
      mockPost.mockResolvedValue({ data: { translated: 'Hola mundo' } });

      const result = await client.translate('Hello world', 'en', 'es');

      expect(mockPost).toHaveBeenCalledWith('/translate', {
        text: 'Hello world',
        source: 'en',
        target: 'es'
      });
      expect(result).toBe('Hola mundo');
    });

    it('should use default source "en" and target "es" when not provided', async () => {
      mockPost.mockResolvedValue({ data: { translated: 'Hola' } });

      await client.translate('Hello');

      expect(mockPost).toHaveBeenCalledWith('/translate', {
        text: 'Hello',
        source: 'en',
        target: 'es'
      });
    });

    it('should return original text when text is empty string', async () => {
      const result = await client.translate('', 'en', 'es');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    it('should return original text when text is null', async () => {
      const result = await client.translate(null as any, 'en', 'es');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return original text when text is undefined', async () => {
      const result = await client.translate(undefined as any, 'en', 'es');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return original text when source equals target', async () => {
      const result = await client.translate('Hello', 'en', 'en');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toBe('Hello');
    });

    it('should return original text on API error', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      const result = await client.translate('Hello', 'en', 'fr');

      expect(result).toBe('Hello');
    });

    it('should log error message on API failure', async () => {
      mockPost.mockRejectedValue(new Error('Connection refused'));

      await client.translate('Hello', 'en', 'fr');

      expect(console.error).toHaveBeenCalledWith('Translation failed:', 'Connection refused');
    });

    it('should handle different language pairs', async () => {
      mockPost.mockResolvedValue({ data: { translated: 'Bonjour le monde' } });

      const result = await client.translate('Hello world', 'en', 'fr');

      expect(mockPost).toHaveBeenCalledWith('/translate', {
        text: 'Hello world',
        source: 'en',
        target: 'fr'
      });
      expect(result).toBe('Bonjour le monde');
    });
  });

  // ---------------------------------------------------------------
  // translateBatch()
  // ---------------------------------------------------------------
  describe('translateBatch', () => {
    it('should POST to /translate/batch and return translated texts', async () => {
      mockPost.mockResolvedValue({
        data: { translations: ['Hola', 'Mundo'] }
      });

      const result = await client.translateBatch(['Hello', 'World'], 'en', 'es');

      expect(mockPost).toHaveBeenCalledWith('/translate/batch', {
        texts: ['Hello', 'World'],
        source: 'en',
        target: 'es'
      });
      expect(result).toEqual(['Hola', 'Mundo']);
    });

    it('should use default source "en" and target "es" when not provided', async () => {
      mockPost.mockResolvedValue({
        data: { translations: ['Hola'] }
      });

      await client.translateBatch(['Hello']);

      expect(mockPost).toHaveBeenCalledWith('/translate/batch', {
        texts: ['Hello'],
        source: 'en',
        target: 'es'
      });
    });

    it('should return original texts when array is empty', async () => {
      const result = await client.translateBatch([], 'en', 'es');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return original texts when source equals target', async () => {
      const texts = ['Hello', 'World'];
      const result = await client.translateBatch(texts, 'en', 'en');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toEqual(['Hello', 'World']);
    });

    it('should filter out empty strings before sending to API', async () => {
      mockPost.mockResolvedValue({
        data: { translations: ['Hola', 'Mundo'] }
      });

      await client.translateBatch(['Hello', '', 'World'], 'en', 'es');

      expect(mockPost).toHaveBeenCalledWith('/translate/batch', {
        texts: ['Hello', 'World'],
        source: 'en',
        target: 'es'
      });
    });

    it('should preserve empty strings in their original positions in the result', async () => {
      mockPost.mockResolvedValue({
        data: { translations: ['Hola', 'Mundo'] }
      });

      const result = await client.translateBatch(['Hello', '', 'World'], 'en', 'es');

      expect(result).toEqual(['Hola', '', 'Mundo']);
    });

    it('should return original texts when all texts are empty', async () => {
      const texts = ['', '', ''];
      const result = await client.translateBatch(texts, 'en', 'es');

      expect(mockPost).not.toHaveBeenCalled();
      expect(result).toEqual(['', '', '']);
    });

    it('should return original texts on API error', async () => {
      mockPost.mockRejectedValue(new Error('Service unavailable'));

      const texts = ['Hello', 'World'];
      const result = await client.translateBatch(texts, 'en', 'fr');

      expect(result).toEqual(['Hello', 'World']);
    });

    it('should log error message on API failure', async () => {
      mockPost.mockRejectedValue(new Error('Timeout'));

      await client.translateBatch(['Hello'], 'en', 'fr');

      expect(console.error).toHaveBeenCalledWith('Batch translation failed:', 'Timeout');
    });

    it('should handle null/falsy values in the texts array', async () => {
      mockPost.mockResolvedValue({
        data: { translations: ['Hola'] }
      });

      const result = await client.translateBatch(['Hello', null as any, ''], 'en', 'es');

      // null and '' are both falsy, so only 'Hello' is sent
      expect(mockPost).toHaveBeenCalledWith('/translate/batch', {
        texts: ['Hello'],
        source: 'en',
        target: 'es'
      });
      // null and '' stay in original positions
      expect(result).toEqual(['Hola', null, '']);
    });
  });

  // ---------------------------------------------------------------
  // getCachedTranslation()
  // ---------------------------------------------------------------
  describe('getCachedTranslation', () => {
    it('should query the translation database with correct parameters', async () => {
      mockFindOne.mockResolvedValue(null);

      await client.getCachedTranslation('q123', 'question', 'es');

      expect(mongoose.connection.useDb).toHaveBeenCalledWith('translation');
      expect(mockCollection).toHaveBeenCalledWith('content_translations');
      expect(mockFindOne).toHaveBeenCalledWith({
        content_id: 'q123',
        content_type: 'question',
        target_lang: 'es',
        translation_status: 'complete'
      });
    });

    it('should return translated_fields when cached translation exists', async () => {
      const translatedFields = { title: 'Titulo', body: 'Cuerpo' };
      mockFindOne.mockResolvedValue({
        _id: 'cached_id_1',
        translated_fields: translatedFields
      });

      const result = await client.getCachedTranslation('q123', 'question', 'es');

      expect(result).toEqual({ title: 'Titulo', body: 'Cuerpo' });
    });

    it('should return null when no cached translation exists', async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await client.getCachedTranslation('q999', 'question', 'fr');

      expect(result).toBeNull();
    });

    it('should increment access_count when cached translation is found', async () => {
      mockFindOne.mockResolvedValue({
        _id: 'cached_id_2',
        translated_fields: { name: 'Nombre' }
      });

      await client.getCachedTranslation('c456', 'category', 'es');

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: 'cached_id_2' },
        { $inc: { access_count: 1 } }
      );
    });

    it('should not increment access_count when no cached translation is found', async () => {
      mockFindOne.mockResolvedValue(null);

      await client.getCachedTranslation('c456', 'category', 'es');

      expect(mockUpdateOne).not.toHaveBeenCalled();
    });

    it('should return null on database error', async () => {
      mockFindOne.mockRejectedValue(new Error('DB connection failed'));

      const result = await client.getCachedTranslation('q123', 'question', 'es');

      expect(result).toBeNull();
    });

    it('should still return translated_fields even if access_count update fails', async () => {
      const translatedFields = { title: 'Titulo' };
      mockFindOne.mockResolvedValue({
        _id: 'cached_id_3',
        translated_fields: translatedFields
      });
      mockUpdateOne.mockRejectedValue(new Error('Update failed'));

      const result = await client.getCachedTranslation('q123', 'question', 'es');

      expect(result).toEqual({ title: 'Titulo' });
    });

    it('should work with different content types', async () => {
      mockFindOne.mockResolvedValue(null);

      await client.getCachedTranslation('f789', 'flashcard', 'de');

      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'f789',
          content_type: 'flashcard',
          target_lang: 'de'
        })
      );
    });
  });

  // ---------------------------------------------------------------
  // cacheTranslation()
  // ---------------------------------------------------------------
  describe('cacheTranslation', () => {
    it('should upsert translation into the database with correct filter', async () => {
      const translatedFields = { title: 'Titulo', description: 'Descripcion' };

      await client.cacheTranslation('q123', 'question', 'es', translatedFields);

      expect(mongoose.connection.useDb).toHaveBeenCalledWith('translation');
      expect(mockCollection).toHaveBeenCalledWith('content_translations');
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { content_id: 'q123', content_type: 'question', target_lang: 'es' },
        expect.objectContaining({
          $set: expect.objectContaining({
            translated_fields: translatedFields,
            translation_source: 'api',
            translation_status: 'complete',
            source_lang: 'en'
          }),
          $setOnInsert: expect.objectContaining({
            access_count: 0
          })
        }),
        { upsert: true }
      );
    });

    it('should set updated_at in $set and created_at in $setOnInsert', async () => {
      const translatedFields = { name: 'Nombre' };

      await client.cacheTranslation('c456', 'category', 'fr', translatedFields);

      const updateCall = mockUpdateOne.mock.calls[0];
      const updateDoc = updateCall[1];

      expect(updateDoc.$set.updated_at).toBeInstanceOf(Date);
      expect(updateDoc.$setOnInsert.created_at).toBeInstanceOf(Date);
    });

    it('should use upsert: true option', async () => {
      await client.cacheTranslation('q123', 'question', 'es', { title: 'T' });

      const options = mockUpdateOne.mock.calls[0][2];
      expect(options).toEqual({ upsert: true });
    });

    it('should not throw on database error', async () => {
      mockUpdateOne.mockRejectedValueOnce(new Error('Write conflict'));

      await expect(
        client.cacheTranslation('q123', 'question', 'es', { title: 'T' })
      ).resolves.toBeUndefined();
    });

    it('should log error on database failure', async () => {
      mockUpdateOne.mockRejectedValueOnce(new Error('Disk full'));

      await client.cacheTranslation('q123', 'question', 'es', { title: 'T' });

      expect(console.error).toHaveBeenCalledWith('Failed to cache translation:', 'Disk full');
    });

    it('should handle empty translatedFields object', async () => {
      await client.cacheTranslation('q123', 'question', 'es', {});

      expect(mockUpdateOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            translated_fields: {}
          })
        }),
        { upsert: true }
      );
    });

    it('should set translation_source as "api" and translation_status as "complete"', async () => {
      await client.cacheTranslation('f789', 'flashcard', 'de', { front: 'Vorne' });

      const updateDoc = mockUpdateOne.mock.calls[0][1];
      expect(updateDoc.$set.translation_source).toBe('api');
      expect(updateDoc.$set.translation_status).toBe('complete');
    });

    it('should set source_lang as "en"', async () => {
      await client.cacheTranslation('q123', 'question', 'es', { title: 'T' });

      const updateDoc = mockUpdateOne.mock.calls[0][1];
      expect(updateDoc.$set.source_lang).toBe('en');
    });

    it('should initialize access_count to 0 on insert', async () => {
      await client.cacheTranslation('q123', 'question', 'es', { title: 'T' });

      const updateDoc = mockUpdateOne.mock.calls[0][1];
      expect(updateDoc.$setOnInsert.access_count).toBe(0);
    });
  });
});
