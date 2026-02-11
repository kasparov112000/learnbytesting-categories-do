import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryGridService } from './category-grid.service';

// ───────────────────────────────────────────────────────────
// Test data
// ───────────────────────────────────────────────────────────

const sicilian = {
  _id: 'cat-001',
  name: 'Sicilian Defense',
  isActive: true,
  active: true,
  children: [],
};

const french = {
  _id: 'cat-002',
  name: 'French Defense',
  isActive: true,
  active: true,
  children: [],
};

const allCategories = { result: [sicilian, french], count: 2 };

const gridResult = {
  rows: [sicilian, french],
  lastRow: 2,
};

const searchResult = {
  result: [sicilian],
  count: 1,
};

// ───────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: any;
  let gridService: any;

  beforeEach(async () => {
    const mockCategoriesService = {
      getAll: jest.fn(),
      createCategory: jest.fn(),
      updateCategoryById: jest.fn(),
      delete: jest.fn(),
      findCategoryInTree: jest.fn(),
      getCategoryWithResolvedAiConfig: jest.fn(),
      updateCategoryAiConfig: jest.fn(),
      importCategoryTree: jest.fn(),
      exportCategoryTree: jest.fn(),
      ensureSubcategory: jest.fn(),
      getCategoriesWithTranslation: jest.fn(),
      translateOpeningName: jest.fn(),
      syncCreateCategories: jest.fn(),
      getByCategory: jest.fn(),
      getByLineOfService: jest.fn(),
    };

    const mockGridService = {
      grid: jest.fn(),
      gridFlatten: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: CategoryGridService, useValue: mockGridService },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get(CategoriesService);
    gridService = module.get(CategoryGridService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── GET / ────────────────────────────────────────────

  describe('getAll()', () => {
    it('should call categoriesService.getAll and return result', async () => {
      categoriesService.getAll.mockResolvedValue(allCategories);

      const result = await controller.getAll();

      expect(categoriesService.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(allCategories);
    });
  });

  // ─── POST /grid ───────────────────────────────────────

  describe('grid()', () => {
    it('should call gridService.grid with body and req', async () => {
      const body = { startRow: 0, endRow: 10 };
      const req = { headers: {} } as any;
      gridService.grid.mockResolvedValue(gridResult);

      const result = await controller.grid(body, req);

      expect(gridService.grid).toHaveBeenCalledWith(body, req);
      expect(result).toEqual(gridResult);
    });
  });

  // ─── POST /grid-flatten ───────────────────────────────

  describe('gridFlatten()', () => {
    it('should call gridService.gridFlatten with body and req', async () => {
      const body = { startRow: 0, endRow: 50 };
      const req = {} as any;
      gridService.gridFlatten.mockResolvedValue(gridResult);

      const result = await controller.gridFlatten(body, req);

      expect(gridService.gridFlatten).toHaveBeenCalledWith(body, req);
      expect(result).toEqual(gridResult);
    });
  });

  // ─── POST /search ─────────────────────────────────────

  describe('search()', () => {
    it('should call gridService.search with body.term', async () => {
      gridService.search.mockResolvedValue(searchResult);

      const result = await controller.search({ term: 'Sicilian' });

      expect(gridService.search).toHaveBeenCalledWith('Sicilian');
      expect(result).toEqual(searchResult);
    });

    it('should fall back to body.searchTerm when term is not present', async () => {
      gridService.search.mockResolvedValue(searchResult);

      const result = await controller.search({ searchTerm: 'French' });

      expect(gridService.search).toHaveBeenCalledWith('French');
    });

    it('should pass undefined when neither term nor searchTerm is present', async () => {
      gridService.search.mockResolvedValue({ result: [], count: 0 });

      await controller.search({});

      expect(gridService.search).toHaveBeenCalledWith(undefined);
    });
  });

  // ─── GET /:id/ai-config ──────────────────────────────

  describe('getAiConfig()', () => {
    it('should call categoriesService.getCategoryWithResolvedAiConfig with id', async () => {
      const resolvedCat = { ...sicilian, resolvedAiConfig: { systemPrompt: 'Chess tutor' } };
      categoriesService.getCategoryWithResolvedAiConfig.mockResolvedValue(resolvedCat);

      const result = await controller.getAiConfig('cat-001');

      expect(categoriesService.getCategoryWithResolvedAiConfig).toHaveBeenCalledWith('cat-001');
      expect(result.resolvedAiConfig.systemPrompt).toBe('Chess tutor');
    });
  });

  // ─── PUT /:id/ai-config ──────────────────────────────

  describe('updateAiConfig()', () => {
    it('should call categoriesService.updateCategoryAiConfig with id and body', async () => {
      const aiConfig = { systemPrompt: 'New prompt for tactics' };
      categoriesService.updateCategoryAiConfig.mockResolvedValue({ ...sicilian, aiConfig });

      const result = await controller.updateAiConfig('cat-001', aiConfig);

      expect(categoriesService.updateCategoryAiConfig).toHaveBeenCalledWith('cat-001', aiConfig);
      expect(result.aiConfig).toEqual(aiConfig);
    });
  });

  // ─── POST /import ─────────────────────────────────────

  describe('importTree()', () => {
    it('should call categoriesService.importCategoryTree with body', async () => {
      const body = { categories: [{ name: "Queen's Gambit" }] };
      categoriesService.importCategoryTree.mockResolvedValue({ success: true, imported: 1 });

      const result = await controller.importTree(body);

      expect(categoriesService.importCategoryTree).toHaveBeenCalledWith(body);
      expect(result.success).toBe(true);
    });
  });

  // ─── GET /export ──────────────────────────────────────

  describe('exportTree()', () => {
    it('should call categoriesService.exportCategoryTree', async () => {
      categoriesService.exportCategoryTree.mockResolvedValue({ success: true, count: 2, categories: [sicilian, french] });

      const result = await controller.exportTree();

      expect(categoriesService.exportCategoryTree).toHaveBeenCalledTimes(1);
      expect(result.count).toBe(2);
    });
  });

  // ─── POST /ensure-subcategory ─────────────────────────

  describe('ensureSubcategory()', () => {
    it('should call categoriesService.ensureSubcategory with body', async () => {
      const body = { parentId: 'cat-001', name: 'Najdorf Variation' };
      categoriesService.ensureSubcategory.mockResolvedValue({ success: true, existed: true, category: { name: 'Najdorf Variation' } });

      const result = await controller.ensureSubcategory(body);

      expect(categoriesService.ensureSubcategory).toHaveBeenCalledWith(body);
      expect(result.existed).toBe(true);
    });
  });

  // ─── GET /translated ──────────────────────────────────

  describe('getTranslated()', () => {
    it('should call categoriesService.getCategoriesWithTranslation with lang query param', async () => {
      categoriesService.getCategoriesWithTranslation.mockResolvedValue(allCategories);

      const result = await controller.getTranslated('es');

      expect(categoriesService.getCategoriesWithTranslation).toHaveBeenCalledWith('es');
      expect(result).toEqual(allCategories);
    });

    it('should pass undefined when no lang query param', async () => {
      categoriesService.getCategoriesWithTranslation.mockResolvedValue(allCategories);

      await controller.getTranslated(undefined as any);

      expect(categoriesService.getCategoriesWithTranslation).toHaveBeenCalledWith(undefined);
    });
  });

  // ─── POST /translate-opening ──────────────────────────

  describe('translateOpening()', () => {
    it('should call categoriesService.translateOpeningName with correct args', async () => {
      const body = { openingName: 'Sicilian Defense', eco: 'B20', targetLang: 'es' };
      categoriesService.translateOpeningName.mockResolvedValue({
        original: 'Sicilian Defense',
        translated: 'Defensa Siciliana',
        eco: 'B20',
        targetLang: 'es',
      });

      const result = await controller.translateOpening(body);

      expect(categoriesService.translateOpeningName).toHaveBeenCalledWith('Sicilian Defense', 'B20', 'es');
      expect(result.translated).toBe('Defensa Siciliana');
    });

    it('should handle missing fields by passing undefined', async () => {
      categoriesService.translateOpeningName.mockResolvedValue({ original: undefined, translated: undefined });

      await controller.translateOpening({});

      expect(categoriesService.translateOpeningName).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  // ─── POST /sync/create ────────────────────────────────

  describe('syncCreate()', () => {
    it('should call categoriesService.syncCreateCategories with body and req', async () => {
      const body = { categories: [{ name: 'English Opening' }] };
      const req = {} as any;
      categoriesService.syncCreateCategories.mockResolvedValue({ success: true, results: [] });

      const result = await controller.syncCreate(body, req);

      expect(categoriesService.syncCreateCategories).toHaveBeenCalledWith(body, req);
      expect(result.success).toBe(true);
    });
  });

  // ─── POST /create ─────────────────────────────────────

  describe('create()', () => {
    it('should call categoriesService.createCategory with body and req', async () => {
      const body = { name: "King's Indian Defense" };
      const req = { body: { currentUser: { info: { guid: 'user-1' } } } } as any;
      categoriesService.createCategory.mockResolvedValue({ ...body, _id: 'new-id' });

      const result = await controller.create(body, req);

      expect(categoriesService.createCategory).toHaveBeenCalledWith(body, req);
      expect(result.name).toBe("King's Indian Defense");
    });
  });

  // ─── GET /find/:id ────────────────────────────────────

  describe('findInTree()', () => {
    it('should call categoriesService.findCategoryInTree with id', async () => {
      categoriesService.findCategoryInTree.mockResolvedValue(sicilian);

      const result = await controller.findInTree('cat-001');

      expect(categoriesService.findCategoryInTree).toHaveBeenCalledWith('cat-001');
      expect(result).toEqual(sicilian);
    });
  });

  // ─── POST /query ──────────────────────────────────────

  describe('getByCategory()', () => {
    it('should call categoriesService.getByCategory with body', async () => {
      categoriesService.getByCategory.mockResolvedValue(allCategories);

      const body = { filter: 'chess' };
      const result = await controller.getByCategory(body);

      expect(categoriesService.getByCategory).toHaveBeenCalledWith(body);
      expect(result).toEqual(allCategories);
    });
  });

  // ─── POST /:id (getByLineOfService) ──────────────────

  describe('getByLineOfService()', () => {
    it('should call categoriesService.getByLineOfService with id and body', async () => {
      categoriesService.getByLineOfService.mockResolvedValue(allCategories);

      const result = await controller.getByLineOfService('los-1', { data: true });

      expect(categoriesService.getByLineOfService).toHaveBeenCalledWith('los-1', { data: true });
      expect(result).toEqual(allCategories);
    });
  });

  // ─── PUT /:id ─────────────────────────────────────────

  describe('update()', () => {
    it('should call categoriesService.updateCategoryById with id, body, and req', async () => {
      const body = { name: 'Sicilian Updated' };
      const req = {} as any;
      categoriesService.updateCategoryById.mockResolvedValue({ ...sicilian, name: 'Sicilian Updated' });

      const result = await controller.update('cat-001', body, req);

      expect(categoriesService.updateCategoryById).toHaveBeenCalledWith('cat-001', body, req);
      expect(result.name).toBe('Sicilian Updated');
    });
  });

  // ─── DELETE /:id ──────────────────────────────────────

  describe('deleteCategory()', () => {
    it('should call categoriesService.delete with id', async () => {
      categoriesService.delete.mockResolvedValue({ success: true, message: 'Category cat-001 deleted' });

      const result = await controller.deleteCategory('cat-001');

      expect(categoriesService.delete).toHaveBeenCalledWith('cat-001');
      expect(result.success).toBe(true);
    });
  });

  // ─── Edge cases ───────────────────────────────────────

  describe('edge cases', () => {
    it('should propagate service errors to caller', async () => {
      categoriesService.getAll.mockRejectedValue(new Error('DB connection failed'));

      await expect(controller.getAll()).rejects.toThrow('DB connection failed');
    });

    it('should propagate NotFoundException from delete', async () => {
      const { NotFoundException } = require('@nestjs/common');
      categoriesService.delete.mockRejectedValue(new NotFoundException('Not found'));

      await expect(controller.deleteCategory('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException from import', async () => {
      const { BadRequestException } = require('@nestjs/common');
      categoriesService.importCategoryTree.mockRejectedValue(new BadRequestException('Invalid'));

      await expect(controller.importTree({ invalid: true })).rejects.toThrow(BadRequestException);
    });

    it('should pass empty body to create without crashing', async () => {
      categoriesService.createCategory.mockResolvedValue({ _id: 'new' });

      const result = await controller.create({}, {} as any);

      expect(categoriesService.createCategory).toHaveBeenCalledWith({}, {});
    });

    it('should pass empty body to search without crashing', async () => {
      gridService.search.mockResolvedValue({ result: [], count: 0 });

      const result = await controller.search({});

      expect(gridService.search).toHaveBeenCalled();
    });
  });
});
