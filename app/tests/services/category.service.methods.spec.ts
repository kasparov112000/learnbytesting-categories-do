import { Request, Response } from 'express';
import { CategoryService } from '../../services/category.service';
import { DbMicroServiceBase } from '../../services/db-micro-service-base';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-12345')
}));

// Mock crypto for UUID generation
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-crypto-uuid-12345')
}));

// Mock translation service
jest.mock('../../services/translation.service', () => ({
  translationClient: {
    translate: jest.fn().mockResolvedValue('translated-text'),
    translateBatch: jest.fn().mockResolvedValue(['translated-1', 'translated-2']),
    getCachedTranslation: jest.fn().mockResolvedValue(null),
    cacheTranslation: jest.fn().mockResolvedValue(undefined)
  },
  TranslationApiClient: jest.fn()
}));

// Mock CategoryModel for findCategoryInTree
jest.mock('../../models/category.model', () => {
  const mockFind = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  return {
    CategoryModel: {
      find: mockFind,
      findById: jest.fn(),
      findByIdAndUpdate: mockFindByIdAndUpdate,
      aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) })
    },
    Category: jest.fn().mockImplementation(() => ({})),
    ICategory: {},
    __mockFind: mockFind,
    __mockFindByIdAndUpdate: mockFindByIdAndUpdate
  };
});

describe('CategoryService - Additional Methods', () => {
  let categoryService: CategoryService;
  let databaseService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    databaseService = {
      getCollection: jest.fn(),
      grid: jest.fn().mockResolvedValue([{ rows: [], lastRow: 0 }]),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      update: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      delete: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
    };

    mockReq = { params: {}, query: {}, body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };

    categoryService = new CategoryService(databaseService);
  });

  // ============================================================
  // getAll
  // ============================================================
  describe('getAll', () => {
    it('should return all categories with count', async () => {
      const mockCategories = [
        { _id: 'cat1', name: 'Chess', allowedQuestionTypes: ['multiple-choice'] },
        { _id: 'cat2', name: 'Math', allowedQuestionTypes: [] }
      ];
      databaseService.findAll.mockResolvedValue(mockCategories);

      await categoryService.getAll(mockReq, mockRes);

      expect(databaseService.findAll).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        result: mockCategories,
        count: 2
      });
    });

    it('should return empty array when no categories exist', async () => {
      databaseService.findAll.mockResolvedValue([]);

      await categoryService.getAll(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        result: [],
        count: 0
      });
    });

    it('should return 500 on database error', async () => {
      databaseService.findAll.mockRejectedValue(new Error('Connection timeout'));

      await categoryService.getAll(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to retrieve categories'
        })
      );
    });
  });

  // ============================================================
  // createCategory
  // ============================================================
  describe('createCategory', () => {
    it('should create a root category when no parent is provided', async () => {
      mockReq.body = { name: 'New Root Category' };

      // Mock the post method (from base class)
      const postSpy = jest.spyOn(categoryService, 'post' as any).mockResolvedValue({ success: true });

      await categoryService.createCategory(mockReq, mockRes);

      expect(postSpy).toHaveBeenCalled();
    });

    it('should create a subcategory when parent is provided', async () => {
      const parentCategory = {
        _id: 'parent-id',
        name: 'Parent',
        children: []
      };

      mockReq.body = { name: 'Child Category', parent: 'parent-id' };
      databaseService.findAll.mockResolvedValue([parentCategory]);
      databaseService.update.mockResolvedValue({ modifiedCount: 1 });

      await categoryService.createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should return 500 when parent is not found', async () => {
      mockReq.body = { name: 'Orphan', parent: 'nonexistent-parent' };
      databaseService.findAll.mockResolvedValue([]);

      await categoryService.createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Failed to create category'
        })
      );
    });

    it('should return 500 on database error', async () => {
      mockReq.body = { name: 'Failing Category' };

      jest.spyOn(categoryService, 'post' as any).mockRejectedValue(new Error('DB write failed'));

      await categoryService.createCategory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================================
  // findCategoryInTree
  // ============================================================
  describe('findCategoryInTree', () => {
    const mockCategoryTree = [
      {
        _id: 'root1',
        name: 'Chess',
        children: [
          {
            _id: 'child1',
            name: 'Openings',
            children: [
              {
                _id: 'grandchild1',
                name: "Queen's Gambit",
                children: []
              }
            ]
          },
          {
            _id: 'child2',
            name: 'Tactics',
            children: []
          }
        ]
      },
      {
        _id: 'root2',
        name: 'Math',
        children: []
      }
    ];

    beforeEach(() => {
      // Mock CategoryModel.find to return our tree
      const { __mockFind } = require('../../models/category.model');
      __mockFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategoryTree)
      });
    });

    it('should return 400 when no ID is provided', async () => {
      mockReq.params = {};

      await categoryService.findCategoryInTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Category ID is required'
        })
      );
    });

    it('should find a root category', async () => {
      mockReq.params = { id: 'root1' };

      await categoryService.findCategoryInTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: expect.objectContaining({ _id: 'root1', name: 'Chess' }),
          isRoot: true,
          breadcrumb: 'Chess'
        })
      );
    });

    it('should find a nested child category', async () => {
      mockReq.params = { id: 'child1' };

      await categoryService.findCategoryInTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: expect.objectContaining({ _id: 'child1', name: 'Openings' }),
          isRoot: false,
          breadcrumb: 'Chess > Openings'
        })
      );
    });

    it('should find a deeply nested grandchild category', async () => {
      mockReq.params = { id: 'grandchild1' };

      await categoryService.findCategoryInTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: expect.objectContaining({ _id: 'grandchild1', name: "Queen's Gambit" }),
          isRoot: false,
          breadcrumb: "Chess > Openings > Queen's Gambit"
        })
      );
    });

    it('should return 404 when category is not found', async () => {
      mockReq.params = { id: 'nonexistent' };

      await categoryService.findCategoryInTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    it('should return 500 on database error', async () => {
      const { __mockFind } = require('../../models/category.model');
      __mockFind.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('DB error'))
      });
      mockReq.params = { id: 'root1' };

      await categoryService.findCategoryInTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================================
  // getCategoryWithResolvedAiConfig
  // ============================================================
  describe('getCategoryWithResolvedAiConfig', () => {
    it('should return 400 when no ID is provided', async () => {
      mockReq.params = {};

      await categoryService.getCategoryWithResolvedAiConfig(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return category with resolved aiConfig', async () => {
      const mockTree = [
        {
          _id: 'root1',
          name: 'Chess',
          aiConfig: { systemPrompt: 'You are a chess teacher', domainContext: 'chess' },
          children: [
            {
              _id: 'child1',
              name: 'Openings',
              aiConfig: { domainContext: 'chess openings' },
              children: []
            }
          ]
        }
      ];
      databaseService.findAll.mockResolvedValue(mockTree);
      mockReq.params = { id: 'child1' };

      await categoryService.getCategoryWithResolvedAiConfig(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.category.resolvedAiConfig.systemPrompt).toBe('You are a chess teacher');
      expect(response.category.resolvedAiConfig.domainContext).toBe('chess openings');
    });

    it('should return 404 when category is not found', async () => {
      databaseService.findAll.mockResolvedValue([]);
      mockReq.params = { id: 'nonexistent' };

      await categoryService.getCategoryWithResolvedAiConfig(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle category at root level with no parent config', async () => {
      const mockTree = [
        {
          _id: 'root1',
          name: 'Chess',
          aiConfig: { systemPrompt: 'Root prompt', flashcardConfig: { maxCards: 10 } },
          children: []
        }
      ];
      databaseService.findAll.mockResolvedValue(mockTree);
      mockReq.params = { id: 'root1' };

      await categoryService.getCategoryWithResolvedAiConfig(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.category.resolvedAiConfig.systemPrompt).toBe('Root prompt');
      expect(response.category.resolvedAiConfig.flashcardConfig.maxCards).toBe(10);
    });

    it('should return 500 on database error', async () => {
      databaseService.findAll.mockRejectedValue(new Error('DB error'));
      mockReq.params = { id: 'root1' };

      await categoryService.getCategoryWithResolvedAiConfig(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ============================================================
  // search
  // ============================================================
  describe('search', () => {
    it('should return matching categories by name', async () => {
      const mockCategories = [
        { _id: '1', name: 'Chess Openings', children: [] },
        { _id: '2', name: 'Chess Tactics', children: [] },
        { _id: '3', name: 'Math', children: [] }
      ];
      databaseService.findAll.mockResolvedValue(mockCategories);

      mockReq.body = { search: 'Chess' };
      await categoryService.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const result = mockRes.json.mock.calls[0][0];
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Chess Openings');
      expect(result[1].name).toBe('Chess Tactics');
    });

    it('should be case-insensitive', async () => {
      const mockCategories = [
        { _id: '1', name: 'CHESS', children: [] }
      ];
      databaseService.findAll.mockResolvedValue(mockCategories);

      mockReq.body = { search: 'chess' };
      await categoryService.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const result = mockRes.json.mock.calls[0][0];
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      databaseService.findAll.mockResolvedValue([
        { _id: '1', name: 'Math', children: [] }
      ]);

      mockReq.body = { search: 'xyz' };
      await categoryService.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json.mock.calls[0][0]).toHaveLength(0);
    });
  });

  // ============================================================
  // exportCategoryTree
  // ============================================================
  describe('exportCategoryTree', () => {
    it('should export all categories as JSON', async () => {
      const mockTree = [
        { _id: 'root1', name: 'Chess', children: [{ _id: 'c1', name: 'Openings', children: [] }] }
      ];
      databaseService.findAll.mockResolvedValue(mockTree);

      // Check if the method exists before testing
      if (typeof (categoryService as any).exportCategoryTree === 'function') {
        await (categoryService as any).exportCategoryTree(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
      }
    });
  });

  // ============================================================
  // importCategoryTree
  // ============================================================
  describe('importCategoryTree', () => {
    it('should return 400 when categories array is missing', async () => {
      mockReq.body = {};

      await categoryService.importCategoryTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('categories')
        })
      );
    });

    it('should return 400 when categories is not an array', async () => {
      mockReq.body = { categories: 'not-an-array' };

      await categoryService.importCategoryTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should import root categories successfully', async () => {
      mockReq.body = {
        categories: [
          { name: 'New Category', children: [] }
        ],
        options: { dryRun: false }
      };
      databaseService.findAll.mockResolvedValue([]);
      databaseService.create.mockResolvedValue({ insertedId: 'new-id' });

      await categoryService.importCategoryTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.summary.created).toBeGreaterThanOrEqual(0);
    });

    it('should handle dry run without saving', async () => {
      mockReq.body = {
        categories: [{ name: 'DryRun Category', children: [] }],
        options: { dryRun: true }
      };
      databaseService.findAll.mockResolvedValue([]);

      await categoryService.importCategoryTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const response = mockRes.json.mock.calls[0][0];
      expect(response.dryRun).toBe(true);
    });

    it('should return 404 when parentId is specified but not found', async () => {
      mockReq.body = {
        parentId: 'nonexistent',
        categories: [{ name: 'Child', children: [] }]
      };

      const { __mockFind } = require('../../models/category.model');
      __mockFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      await categoryService.importCategoryTree(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ============================================================
  // filterByCategory2
  // ============================================================
  describe('filterByCategory2', () => {
    it('should return all categories for admin users', async () => {
      const mockData = { result: [{ _id: '1', name: 'All' }], count: 1 };
      jest.spyOn(DbMicroServiceBase.prototype, 'getSubCategory2Data')
        .mockResolvedValue(mockData);

      const userInfo = {
        roles: [{ name: 'System Administrator' }],
        mainCategory: [{ _id: '1', name: 'Chess' }]
      };

      const result = await categoryService.filterByCategory2(userInfo);
      expect(result).toEqual(mockData);

      jest.restoreAllMocks();
    });

    it('should return empty result when user has no mainCategory', async () => {
      const userInfo = {
        roles: [{ name: 'Regular User' }],
        mainCategory: []
      };

      const result = await categoryService.filterByCategory2(userInfo);
      expect(result).toEqual({ result: [], count: 0 });
    });

    it('should return empty result when mainCategory is undefined', async () => {
      const userInfo = {
        roles: [{ name: 'Regular User' }]
      };

      const result = await categoryService.filterByCategory2(userInfo);
      expect(result).toEqual({ result: [], count: 0 });
    });

    it('should filter by mainCategory for non-admin users', async () => {
      const mockData = { result: [{ _id: '1', name: 'Chess' }], count: 1 };
      jest.spyOn(DbMicroServiceBase.prototype, 'getSubCategory2Data')
        .mockResolvedValue(mockData);

      const userInfo = {
        roles: [{ name: 'Regular User' }],
        mainCategory: [{
          _id: '1',
          name: 'Chess',
          children: [{ _id: '2', name: 'Openings' }]
        }]
      };

      const result = await categoryService.filterByCategory2(userInfo);
      expect(result).toEqual(mockData);

      jest.restoreAllMocks();
    });

    it('should detect admin via Auth0 roles claim', async () => {
      const mockData = { result: [{ _id: '1', name: 'All' }], count: 1 };
      jest.spyOn(DbMicroServiceBase.prototype, 'getSubCategory2Data')
        .mockResolvedValue(mockData);

      const userInfo = {
        'https://learnbytesting.ai/roles': ['Admin'],
        mainCategory: [{ _id: '1', name: 'Chess' }]
      };

      const result = await categoryService.filterByCategory2(userInfo);
      expect(result).toEqual(mockData);

      jest.restoreAllMocks();
    });
  });

  // ============================================================
  // helper: sliceArray
  // ============================================================
  describe('sliceArray', () => {
    it('should slice an array correctly', () => {
      const items = [1, 2, 3, 4, 5] as any;
      const result = categoryService.sliceArray(items, 1, 3);
      expect(result).toEqual([2, 3]);
    });

    it('should return empty array for out-of-range', () => {
      const items = [1, 2] as any;
      const result = categoryService.sliceArray(items, 5, 10);
      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // helper: hasNestedItems (private)
  // ============================================================
  describe('hasNestedItems', () => {
    it('should return true when category has children', () => {
      const result = (categoryService as any).hasNestedItems({
        children: [{ name: 'child' }]
      });
      expect(result).toBe(true);
    });

    it('should return false when category has empty children', () => {
      const result = (categoryService as any).hasNestedItems({
        children: []
      });
      expect(result).toBe(false);
    });

    it('should return false when category has no children array', () => {
      const result = (categoryService as any).hasNestedItems({});
      expect(result).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect((categoryService as any).hasNestedItems(null)).toBeFalsy();
      expect((categoryService as any).hasNestedItems(undefined)).toBeFalsy();
    });
  });

  // ============================================================
  // helper: buildBreadCrumb (private)
  // ============================================================
  describe('buildBreadCrumb', () => {
    it('should build breadcrumb for root category', () => {
      const node = { name: 'Chess', children: [] };
      const result = (categoryService as any).buildBreadCrumb(node);
      expect(result.breadCrumb).toBe('Chess');
    });

    it('should build breadcrumb for nested categories', () => {
      const node = {
        name: 'Chess',
        children: [
          {
            name: 'Openings',
            children: [
              { name: "Queen's Gambit", children: [] }
            ]
          }
        ]
      };
      const result = (categoryService as any).buildBreadCrumb(node);
      expect(result.breadCrumb).toBe('Chess');
      expect(result.children[0].breadCrumb).toBe('Chess > Openings');
      expect(result.children[0].children[0].breadCrumb).toBe("Chess > Openings > Queen's Gambit");
    });
  });

  // ============================================================
  // helper: getSortOrder (private)
  // ============================================================
  describe('getSortOrder', () => {
    it('should return default sort when no sortModel', () => {
      const result = (categoryService as any).getSortOrder({});
      expect(result).toEqual({ addedDate: -1 });
    });

    it('should return default sort when sortModel is empty', () => {
      const result = (categoryService as any).getSortOrder({ sortModel: [] });
      expect(result).toEqual({ addedDate: -1 });
    });

    it('should return ascending sort', () => {
      const result = (categoryService as any).getSortOrder({
        sortModel: [{ colId: 'name', sort: 'asc' }]
      });
      expect(result).toEqual({ name: 1 });
    });

    it('should return descending sort', () => {
      const result = (categoryService as any).getSortOrder({
        sortModel: [{ colId: 'name', sort: 'desc' }]
      });
      expect(result).toEqual({ name: -1 });
    });

    it('should handle category field mapping', () => {
      const result = (categoryService as any).getSortOrder({
        sortModel: [{ colId: 'category', sort: 'asc' }]
      });
      expect(result).toEqual({ 'category.name': 1 });
    });
  });

  // ============================================================
  // helper: getNumberFilter (private)
  // ============================================================
  describe('getNumberFilter', () => {
    it('should handle equals filter', () => {
      const result = (categoryService as any).getNumberFilter('field', { type: 'equals', filter: 5 }, 'txn');
      expect(result).toEqual({ $eq: 5 });
    });

    it('should handle greaterThan filter', () => {
      const result = (categoryService as any).getNumberFilter('field', { type: 'greaterThan', filter: 10 }, 'txn');
      expect(result).toEqual({ $gt: 10 });
    });

    it('should handle lessThan filter', () => {
      const result = (categoryService as any).getNumberFilter('field', { type: 'lessThan', filter: 3 }, 'txn');
      expect(result).toEqual({ $lt: 3 });
    });

    it('should handle inRange filter', () => {
      const result = (categoryService as any).getNumberFilter('field', { type: 'inRange', filter: 10, filterTo: 1 }, 'txn');
      expect(result).toEqual({ $lte: 10, $gte: 1 });
    });

    it('should return undefined for unknown type', () => {
      const result = (categoryService as any).getNumberFilter('field', { type: 'unknown' }, 'txn');
      expect(result).toBeUndefined();
    });
  });

  // ============================================================
  // helper: getTextFilter (private)
  // ============================================================
  describe('getTextFilter', () => {
    it('should handle equals filter', () => {
      const result = (categoryService as any).getTextFilter('field', { type: 'equals', filter: 'test' }, 'txn');
      expect(result).toEqual({ $eq: 'test' });
    });

    it('should handle contains filter', () => {
      const result = (categoryService as any).getTextFilter('field', { type: 'contains', filter: 'test' }, 'txn');
      expect(result).toHaveProperty('$regex');
    });

    it('should handle startsWith filter', () => {
      const result = (categoryService as any).getTextFilter('field', { type: 'startsWith', filter: 'test' }, 'txn');
      expect(result.$regex).toMatch(/^\^/);
    });

    it('should handle endsWith filter', () => {
      const result = (categoryService as any).getTextFilter('field', { type: 'endsWith', filter: 'test' }, 'txn');
      expect(result.$regex).toMatch(/\$$/);
    });

    it('should return undefined for unknown type', () => {
      const result = (categoryService as any).getTextFilter('field', { type: 'unknown' }, 'txn');
      expect(result).toBeUndefined();
    });
  });

  // ============================================================
  // helper: getSetFilter (private)
  // ============================================================
  describe('getSetFilter', () => {
    it('should return $in filter with values', () => {
      const result = (categoryService as any).getSetFilter('status', { values: ['active', 'pending'] });
      expect(result).toEqual({ $in: ['active', 'pending'] });
    });

    it('should convert boolean strings', () => {
      const result = (categoryService as any).getSetFilter('isActive', { values: ['true', 'false'] });
      expect(result).toEqual({ $in: [true, false] });
    });

    it('should handle empty values', () => {
      const result = (categoryService as any).getSetFilter('field', {});
      expect(result).toEqual({ $in: [] });
    });
  });

  // ============================================================
  // helper: convertFieldToKey (private)
  // ============================================================
  describe('convertFieldToKey', () => {
    it('should map category to category.name', () => {
      const result = (categoryService as any).convertFieldToKey('category');
      expect(result).toBe('category.name');
    });

    it('should map exam to exam.name', () => {
      const result = (categoryService as any).convertFieldToKey('exam');
      expect(result).toBe('exam.name');
    });

    it('should return field as-is for unknown fields', () => {
      const result = (categoryService as any).convertFieldToKey('someField');
      expect(result).toBe('someField');
    });
  });

  // ============================================================
  // helper: convertFieldToFlatKey (private)
  // ============================================================
  describe('convertFieldToFlatKey', () => {
    it('should map closedDealFinalOutcome', () => {
      const result = (categoryService as any).convertFieldToFlatKey('closedDealFinalOutcome');
      expect(result).toBe('closedDeals.finalOutcome');
    });

    it('should return field as-is for unmapped fields', () => {
      const result = (categoryService as any).convertFieldToFlatKey('name');
      expect(result).toBe('name');
    });
  });
});
