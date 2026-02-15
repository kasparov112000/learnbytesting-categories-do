import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryTreeService } from './category-tree.service';
import { TranslationService } from '../translation/translation.service';

// ───────────────────────────────────────────────────────────
// Test data: chess opening categories
// ───────────────────────────────────────────────────────────

const makeCat = (overrides: any = {}) => ({
  _id: 'cat-001',
  name: 'Sicilian Defense',
  isActive: true,
  active: true,
  createUuid: 'uuid-001',
  createCreatedDate: new Date('2025-01-01'),
  createdDate: new Date('2025-01-01'),
  modifiedDate: new Date('2025-06-01'),
  children: [],
  translations: { es: 'Defensa Siciliana', pt: 'Defesa Siciliana' },
  ...overrides,
});

const sicilian = makeCat();
const french = makeCat({
  _id: 'cat-002',
  name: 'French Defense',
  createUuid: 'uuid-002',
  translations: { es: 'Defensa Francesa' },
});
const italian = makeCat({
  _id: 'cat-003',
  name: 'Italian Game',
  createUuid: 'uuid-003',
  translations: {},
});
const najdorf = makeCat({
  _id: 'cat-004',
  name: 'Najdorf Variation',
  createUuid: 'uuid-004',
  parent: 'cat-001',
});
const dragon = makeCat({
  _id: 'cat-005',
  name: 'Dragon Variation',
  createUuid: 'uuid-005',
  parent: 'cat-001',
});

const sicilianWithChildren = {
  ...sicilian,
  children: [najdorf, dragon],
};

const allCategories = [sicilianWithChildren, french, italian];

// ───────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────

describe('CategoriesService', () => {
  let service: CategoriesService;
  let model: any;
  let treeService: any;
  let translationService: any;

  beforeEach(async () => {
    const mockModel: any = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockTreeService = {
      findInTree: jest.fn(),
      flattenNestedStructure: jest.fn(),
      getUpdatedCategory: jest.fn(),
      createNewCategory: jest.fn(),
      resolveAiConfig: jest.fn(),
    };

    const mockTranslationService = {
      translate: jest.fn(),
      translateBatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getModelToken('Categories'), useValue: mockModel },
        { provide: CategoryTreeService, useValue: mockTreeService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    model = module.get(getModelToken('Categories'));
    treeService = module.get(CategoryTreeService);
    translationService = module.get(TranslationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAll ────────────────────────────────────────────

  describe('getAll()', () => {
    it('should return all categories with count', async () => {
      model.aggregate.mockResolvedValue(allCategories);

      const result = await service.getAll();

      expect(model.aggregate).toHaveBeenCalled();
      expect(result.result).toEqual(allCategories);
      expect(result.count).toBe(3);
    });

    it('should return empty array when no categories exist', async () => {
      model.aggregate.mockResolvedValue([]);

      const result = await service.getAll();

      expect(result.result).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  // ─── createCategory ───────────────────────────────────

  describe('createCategory()', () => {
    it('should create a root category when no parent is specified', async () => {
      const body = { name: 'Ruy Lopez' };
      const req = {};
      model.create.mockResolvedValue({ toObject: () => ({ ...body, _id: 'new-id', children: [] }) });

      const result = await service.createCategory(body, req);

      expect(model.create).toHaveBeenCalled();
      expect(result.name).toBe('Ruy Lopez');
      expect(treeService.createNewCategory).not.toHaveBeenCalled();
    });

    it('should delegate to treeService for nested category', async () => {
      const body = { name: 'Sveshnikov Variation', parent: 'cat-001' };
      const req = {};
      treeService.createNewCategory.mockResolvedValue({ ...body, _id: 'nested-id' });

      const result = await service.createCategory(body, req);

      expect(treeService.createNewCategory).toHaveBeenCalledWith(body, req);
      expect(model.create).not.toHaveBeenCalled();
      expect(result.name).toBe('Sveshnikov Variation');
    });

    it('should set createdByGuid when currentUser is present in request', async () => {
      const body = { name: "King's Indian Defense" };
      const req = { body: { currentUser: { info: { guid: 'user-guid-123' } } } };
      model.create.mockResolvedValue({
        toObject: () => ({
          ...body,
          _id: 'new-id',
          createdByGuid: 'user-guid-123',
          modifiedByGuid: 'user-guid-123',
        }),
      });

      await service.createCategory(body, req);

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.createdByGuid).toBe('user-guid-123');
      expect(createArg.modifiedByGuid).toBe('user-guid-123');
    });

    it('should generate _id and createUuid when not provided', async () => {
      const body = { name: 'Caro-Kann Defense' };
      model.create.mockResolvedValue({ toObject: () => ({ ...body, _id: 'generated' }) });

      await service.createCategory(body, {});

      const createArg = model.create.mock.calls[0][0];
      expect(createArg._id).toBeDefined();
      expect(createArg.createUuid).toBeDefined();
    });

    it('should use provided _id when specified', async () => {
      const body = { name: 'Pirc Defense', _id: 'my-custom-id' };
      model.create.mockResolvedValue({ toObject: () => body });

      await service.createCategory(body, {});

      const createArg = model.create.mock.calls[0][0];
      expect(createArg._id).toBe('my-custom-id');
    });

    it('should default active and isActive to true', async () => {
      const body = { name: 'Scandinavian Defense' };
      model.create.mockResolvedValue({ toObject: () => body });

      await service.createCategory(body, {});

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.active).toBe(true);
      expect(createArg.isActive).toBe(true);
    });

    it('should respect explicit active=false', async () => {
      const body = { name: 'Deprecated Opening', active: false, isActive: false };
      model.create.mockResolvedValue({ toObject: () => body });

      await service.createCategory(body, {});

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.active).toBe(false);
      expect(createArg.isActive).toBe(false);
    });

    it('should set dates on new root category', async () => {
      const body = { name: 'Philidor Defense' };
      model.create.mockResolvedValue({ toObject: () => body });

      await service.createCategory(body, {});

      const createArg = model.create.mock.calls[0][0];
      expect(createArg.createCreatedDate).toBeInstanceOf(Date);
      expect(createArg.createdDate).toBeInstanceOf(Date);
      expect(createArg.modifiedDate).toBeInstanceOf(Date);
    });
  });

  // ─── updateCategoryById ───────────────────────────────

  describe('updateCategoryById()', () => {
    it('should find existing category, merge, and save', async () => {
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sicilian) });
      treeService.getUpdatedCategory.mockReturnValue({ ...sicilian, name: 'Sicilian Updated' });
      model.findByIdAndUpdate.mockResolvedValue({ ...sicilian, name: 'Sicilian Updated' });

      const result = await service.updateCategoryById('cat-001', { name: 'Sicilian Updated' }, {});

      expect(model.findById).toHaveBeenCalledWith('cat-001');
      expect(treeService.getUpdatedCategory).toHaveBeenCalledWith(sicilian, { name: 'Sicilian Updated' });
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'cat-001',
        expect.objectContaining({ name: 'Sicilian Updated' }),
        { new: true, lean: true },
      );
      expect(result.name).toBe('Sicilian Updated');
    });

    it('should throw NotFoundException if category does not exist', async () => {
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.updateCategoryById('nonexistent', {}, {})).rejects.toThrow(NotFoundException);
    });

    it('should set modifiedDate on update', async () => {
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sicilian) });
      treeService.getUpdatedCategory.mockReturnValue({ ...sicilian });
      model.findByIdAndUpdate.mockResolvedValue(sicilian);

      await service.updateCategoryById('cat-001', {}, {});

      const updateArg = model.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid when currentUser is present', async () => {
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(sicilian) });
      treeService.getUpdatedCategory.mockReturnValue({ ...sicilian });
      model.findByIdAndUpdate.mockResolvedValue(sicilian);

      const req = { body: { currentUser: { info: { guid: 'admin-guid' } } } };
      await service.updateCategoryById('cat-001', {}, req);

      const updateArg = model.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg.modifiedByGuid).toBe('admin-guid');
    });
  });

  // ─── delete ───────────────────────────────────────────

  describe('delete()', () => {
    it('should delete category by id and return success', async () => {
      model.findByIdAndDelete.mockResolvedValue(sicilian);

      const result = await service.delete('cat-001');

      expect(model.findByIdAndDelete).toHaveBeenCalledWith('cat-001');
      expect(result.success).toBe(true);
      expect(result.message).toContain('cat-001');
    });

    it('should throw NotFoundException if category not found', async () => {
      model.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findCategoryInTree ───────────────────────────────

  describe('findCategoryInTree()', () => {
    it('should delegate to treeService.findInTree with all categories', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(najdorf);

      const result = await service.findCategoryInTree('cat-004');

      expect(treeService.findInTree).toHaveBeenCalledWith(allCategories, 'cat-004');
      expect(result).toEqual(najdorf);
    });

    it('should throw BadRequestException when id is empty', async () => {
      await expect(service.findCategoryInTree('')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when category is not in tree', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(null);

      await expect(service.findCategoryInTree('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getCategoryWithResolvedAiConfig ──────────────────

  describe('getCategoryWithResolvedAiConfig()', () => {
    it('should return category with resolved AI config', async () => {
      const aiConfig = { systemPrompt: 'You are a chess tutor', domainContext: 'chess openings' };
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(sicilian);
      treeService.resolveAiConfig.mockReturnValue(aiConfig);

      const result = await service.getCategoryWithResolvedAiConfig('cat-001');

      expect(treeService.resolveAiConfig).toHaveBeenCalledWith(allCategories, sicilian);
      expect(result.resolvedAiConfig).toEqual(aiConfig);
      expect(result.name).toBe('Sicilian Defense');
    });

    it('should throw NotFoundException if category not found', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(null);

      await expect(service.getCategoryWithResolvedAiConfig('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateCategoryAiConfig ───────────────────────────

  describe('updateCategoryAiConfig()', () => {
    it('should update AI config for a category', async () => {
      const aiConfig = { systemPrompt: 'Focus on tactical puzzles' };
      model.findByIdAndUpdate.mockResolvedValue({ ...sicilian, aiConfig });

      const result = await service.updateCategoryAiConfig('cat-001', aiConfig);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        'cat-001',
        { $set: { aiConfig } },
        { new: true, lean: true },
      );
      expect(result.aiConfig).toEqual(aiConfig);
    });

    it('should throw NotFoundException if category not found', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.updateCategoryAiConfig('missing', { systemPrompt: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── importCategoryTree ───────────────────────────────

  describe('importCategoryTree()', () => {
    it('should import an array of categories', async () => {
      const catsToImport = [
        { name: 'English Opening', _id: 'eng-001' },
        { name: "Queen's Gambit", _id: 'qg-001' },
      ];
      model.create
        .mockResolvedValueOnce({ toObject: () => catsToImport[0] })
        .mockResolvedValueOnce({ toObject: () => catsToImport[1] });

      const result = await service.importCategoryTree({ categories: catsToImport });

      expect(model.create).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
    });

    it('should accept raw array format (no wrapper object)', async () => {
      const catsToImport = [{ name: 'Grunfeld Defense' }];
      model.create.mockResolvedValue({ toObject: () => catsToImport[0] });

      const result = await service.importCategoryTree(catsToImport);

      expect(result.imported).toBe(1);
    });

    it('should throw BadRequestException when data is not an array', async () => {
      await expect(service.importCategoryTree({ name: 'single item' })).rejects.toThrow(BadRequestException);
    });

    it('should generate _id for categories that lack one', async () => {
      const catsToImport = [{ name: 'Nimzo-Indian Defense' }];
      model.create.mockResolvedValue({ toObject: () => ({ name: 'Nimzo-Indian Defense' }) });

      await service.importCategoryTree(catsToImport);

      const createArg = model.create.mock.calls[0][0];
      expect(createArg._id).toBeDefined();
      expect(createArg.createUuid).toBeDefined();
    });
  });

  // ─── exportCategoryTree ───────────────────────────────

  describe('exportCategoryTree()', () => {
    it('should export all categories', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });

      const result = await service.exportCategoryTree();

      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      expect(result.categories).toEqual(allCategories);
    });

    it('should return empty when no categories exist', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.exportCategoryTree();

      expect(result.count).toBe(0);
      expect(result.categories).toEqual([]);
    });
  });

  // ─── ensureSubcategory ────────────────────────────────

  describe('ensureSubcategory()', () => {
    it('should return existing subcategory when it already exists', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(sicilianWithChildren);

      const result = await service.ensureSubcategory({
        parentId: 'cat-001',
        name: 'Najdorf Variation',
      });

      expect(result.existed).toBe(true);
      expect(result.category.name).toBe('Najdorf Variation');
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should create new subcategory when it does not exist', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(sicilianWithChildren);
      model.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.ensureSubcategory({
        parentId: 'cat-001',
        name: 'Scheveningen Variation',
      });

      expect(result.existed).toBe(false);
      expect(result.category.name).toBe('Scheveningen Variation');
      expect(result.category.parent).toBe('cat-001');
      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw BadRequestException when parentId is missing', async () => {
      await expect(
        service.ensureSubcategory({ name: 'Orphan' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when name is missing', async () => {
      await expect(
        service.ensureSubcategory({ parentId: 'cat-001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when parent does not exist', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });
      treeService.findInTree.mockReturnValue(null);

      await expect(
        service.ensureSubcategory({ parentId: 'nonexistent', name: 'Child' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getCategoriesWithTranslation ─────────────────────

  describe('getCategoriesWithTranslation()', () => {
    it('should return untranslated categories when targetLang is "en"', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });

      const result = await service.getCategoriesWithTranslation('en');

      expect(result.result).toEqual(allCategories);
      expect(result.count).toBe(3);
    });

    it('should return untranslated categories when targetLang is empty', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });

      const result = await service.getCategoriesWithTranslation('');

      expect(result.result).toEqual(allCategories);
    });

    it('should apply translations for a given language', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });

      const result = await service.getCategoriesWithTranslation('es');

      expect(result.result[0].name).toBe('Defensa Siciliana');
      expect(result.result[1].name).toBe('Defensa Francesa');
      // Italian Game has no Spanish translation, should keep original
      expect(result.result[2].name).toBe('Italian Game');
    });

    it('should return original name when translation is missing for target lang', async () => {
      const catWithNoTranslations = [makeCat({ name: 'Petrov Defense', translations: undefined })];
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(catWithNoTranslations) });

      const result = await service.getCategoriesWithTranslation('es');

      expect(result.result[0].name).toBe('Petrov Defense');
    });
  });

  // ─── translateOpeningName ─────────────────────────────

  describe('translateOpeningName()', () => {
    it('should translate an opening name via translationService', async () => {
      translationService.translate.mockResolvedValue('Defensa Siciliana');

      const result = await service.translateOpeningName('Sicilian Defense', 'B20', 'es');

      expect(translationService.translate).toHaveBeenCalledWith('Sicilian Defense', 'en', 'es');
      expect(result.original).toBe('Sicilian Defense');
      expect(result.translated).toBe('Defensa Siciliana');
      expect(result.eco).toBe('B20');
    });

    it('should default targetLang to "es" when not provided', async () => {
      translationService.translate.mockResolvedValue('Defensa Francesa');

      const result = await service.translateOpeningName('French Defense', 'C00', undefined);

      expect(translationService.translate).toHaveBeenCalledWith('French Defense', 'en', 'es');
      expect(result.targetLang).toBe('es');
    });

    it('should throw BadRequestException when openingName is empty', async () => {
      await expect(service.translateOpeningName('', 'C00', 'es')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── syncCreateCategories ─────────────────────────────

  describe('syncCreateCategories()', () => {
    it('should skip existing categories and mark them as existed', async () => {
      const body = { categories: [{ name: 'Sicilian Defense' }] };
      model.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(sicilian) });

      const result = await service.syncCreateCategories(body, {});

      expect(result.results[0].existed).toBe(true);
      expect(result.results[0].name).toBe('Sicilian Defense');
      expect(model.create).not.toHaveBeenCalled();
    });

    it('should create new categories when they do not exist', async () => {
      const body = { categories: [{ name: 'London System' }] };
      model.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      model.create.mockResolvedValue({
        toObject: () => ({ name: 'London System', _id: 'london-001' }),
      });

      const result = await service.syncCreateCategories(body, {});

      expect(model.create).toHaveBeenCalledTimes(1);
      expect(result.results[0].existed).toBe(false);
    });

    it('should handle a mix of existing and new categories', async () => {
      const body = {
        categories: [
          { name: 'Sicilian Defense' },
          { name: 'Trompowsky Attack' },
        ],
      };
      model.findOne
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(sicilian) })
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });
      model.create.mockResolvedValue({
        toObject: () => ({ name: 'Trompowsky Attack', _id: 'tromp-001' }),
      });

      const result = await service.syncCreateCategories(body, {});

      expect(result.results).toHaveLength(2);
      expect(result.results[0].existed).toBe(true);
      expect(result.results[1].existed).toBe(false);
    });

    it('should throw BadRequestException if data is not an array', async () => {
      await expect(
        service.syncCreateCategories({ name: 'not an array' }, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept raw array format', async () => {
      const body = [{ name: "King's Gambit" }];
      model.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      model.create.mockResolvedValue({
        toObject: () => ({ name: "King's Gambit", _id: 'kg-001' }),
      });

      const result = await service.syncCreateCategories(body, {});

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });
  });

  // ─── getByLineOfService ───────────────────────────────

  describe('getByLineOfService()', () => {
    it('should return all categories (stub implementation)', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });

      const result = await service.getByLineOfService('los-1', {});

      expect(result.result).toEqual(allCategories);
      expect(result.count).toBe(3);
    });
  });

  // ─── getByCategory ────────────────────────────────────

  describe('getByCategory()', () => {
    it('should return all categories (stub implementation)', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(allCategories) });

      const result = await service.getByCategory({ filter: 'something' });

      expect(result.result).toEqual(allCategories);
      expect(result.count).toBe(3);
    });
  });
});
