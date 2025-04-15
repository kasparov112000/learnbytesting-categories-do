import { Category } from 'hipolito-models';
import { DbMicroServiceBase } from '../../services/db-micro-service-base';
import { CategoryService } from '../../services/category.service';
import { DbService } from '../../services/db.service';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { GridSortItem } from '../../models';
import { DatabaseService } from '../../services/database.service';
import { Category as CategoryModel, ICategory } from '../../models/category.model';
import { Collection } from 'mongodb';

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn().mockReturnValue('test-uuid');
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: mockRandomUUID }
});

// Define mock database service type
type MockDbService = {
  findOne: jest.Mock;
  find: jest.Mock;
  insertOne: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
  grid: jest.Mock;
  collection: {
    aggregate: jest.Mock;
    toArray: jest.Mock;
  };
};

jest.mock('../../services/db.service');

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let databaseService: jest.Mocked<DatabaseService & { grid: () => Collection<Category> }>;
  let mockCollection: jest.Mocked<Collection<Category>>;
  let mockResponse: any;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn()
    } as unknown as jest.Mocked<Collection<Category>>;

    databaseService = {
      findOne: jest.fn(),
      find: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      grid: jest.fn().mockReturnValue(mockCollection)
    } as unknown as jest.Mocked<DatabaseService & { grid: () => Collection<Category> }>;

    categoryService = new CategoryService(databaseService);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpdatedCategory', () => {
    it('should update category with children correctly', () => {
      const existingCategory: Category = {
        _id: '123',
        name: 'Parent',
        children: [],
        active: true,
        createdDate: new Date(),
        modifiedDate: new Date(),
        createCreatedDate: new Date(),
        createUuid: 'existing-uuid'
      };

      const newChild: Category = {
        name: 'Child',
        active: true,
        createdDate: new Date(),
        modifiedDate: new Date(),
        createCreatedDate: new Date(),
        createUuid: 'test-uuid',
        children: []
      };

      const updatedCategory = categoryService.getUpdatedCategory(
        existingCategory,
        { ...existingCategory, children: [newChild] }
      );

      expect(updatedCategory.name).toBe('Parent');
      expect(updatedCategory.children).toHaveLength(1);
      expect(updatedCategory.children[0].name).toBe('Child');
      expect(updatedCategory.children[0].parent).toBe('123');
    });
  });

  describe('syncCreateCategories', () => {
    it('should create categories correctly', async () => {
      const categories: Category[] = [
        {
          name: 'Category 1',
          active: true,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createCreatedDate: new Date(),
          createUuid: 'uuid-1'
        },
        {
          name: 'Category 2',
          active: true,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createCreatedDate: new Date(),
          createUuid: 'uuid-2'
        }
      ];

      (databaseService.findOne as jest.Mock).mockResolvedValue(null);
      (databaseService.insertOne as jest.Mock).mockResolvedValue({ insertedId: 'new-id' });
      (databaseService.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      await categoryService.syncCreateCategories(categories, mockResponse);

      expect(databaseService.insertOne).toHaveBeenCalled();
    });

    it('should update existing categories', async () => {
      const existingCategory: Category = {
        _id: 'existing-id',
        name: 'Old Name',
        active: true,
        createdDate: new Date(),
        modifiedDate: new Date(),
        createCreatedDate: new Date(),
        createUuid: 'existing-uuid'
      };

      (databaseService.findOne as jest.Mock).mockResolvedValue(existingCategory);
      (databaseService.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const newCategories: Category[] = [
        {
          name: 'New Name',
          createUuid: 'existing-uuid',
          active: true,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createCreatedDate: new Date()
        }
      ];

      await categoryService.syncCreateCategories(newCategories, mockResponse);

      expect(databaseService.updateOne).toHaveBeenCalled();
    });

    it('should update an existing category with new children', async () => {
      const mockExistingCategory = {
        _id: '5d2f350d1f6a9b3184b82e56',
        name: 'Chess Openings',
        children: []
      };

      (databaseService.findOne as jest.Mock).mockResolvedValue(mockExistingCategory);
      (databaseService.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      await categoryService.syncCreateCategories([
        {
          name: 'Chess Openings',
          children: [
            {
              name: "Queen's Pawn Opening",
              createUuid: 'test-uuid'
            }
          ]
        }
      ], mockResponse);

      expect(databaseService.updateOne).toHaveBeenCalledTimes(1);
    });

    it('should handle nested children correctly', async () => {
      const mockExistingCategory = new Category();
      mockExistingCategory._id = new ObjectId('5d2f350d1f6a9b3184b82e56').toString();
      mockExistingCategory.name = 'Chess';
      mockExistingCategory.children = [
        {
          name: 'Chess Openings',
          children: [],
          active: true,
          createUuid: 'chess-openings-uuid',
          createCreatedDate: new Date(),
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      const req = {
        body: {
          categories: {
            _id: mockExistingCategory._id,
            name: 'Chess',
            children: [
              {
                name: 'Chess Openings',
                children: [
                  {
                    name: "Queen's Pawn Opening",
                    children: [],
                    active: true,
                    createUuid: 'queens-pawn-uuid',
                    createCreatedDate: new Date(),
                    createdDate: new Date(),
                    modifiedDate: new Date()
                  }
                ],
                active: true,
                createUuid: 'chess-openings-uuid',
                createCreatedDate: new Date(),
                createdDate: new Date(),
                modifiedDate: new Date()
              }
            ]
          }
        }
      };

      const res = {
        send: jest.fn()
      };

      databaseService.find = jest.fn().mockResolvedValue([mockExistingCategory]);
      databaseService.updateOne = jest.fn().mockResolvedValue({
        ...mockExistingCategory,
        children: req.body.categories.children
      });

      await categoryService.syncCreateCategories(req, res);

      expect(databaseService.find).toHaveBeenCalledTimes(1);
      expect(databaseService.updateOne).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('grid', () => {
    it('should handle empty request body', async () => {
      const req = { body: null };
      await categoryService.grid(req.body, mockResponse, 'test-txn');
      expect(mockResponse.json).toHaveBeenCalledWith({
        rows: [],
        lastRow: 0
      });
    });

    it('should handle request with sort model', async () => {
      const sortModel: GridSortItem[] = [{ colId: 'name', sort: 'asc' }];
      const req = {
        body: {
          startRow: 0,
          endRow: 10,
          sortModel,
          search: {
            search: '',
            inflightStart: new Date(),
            inflightEnd: new Date()
          }
        }
      };

      const mockCategories = [
        { name: 'B Category' },
        { name: 'A Category' },
        { name: 'C Category' }
      ];

      (databaseService.grid as jest.Mock).mockResolvedValue([{
        rows: mockCategories,
        lastRow: mockCategories.length
      }]);

      await categoryService.grid(req.body, mockResponse, 'test-txn');

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({ name: 'A Category' }),
            expect.objectContaining({ name: 'B Category' }),
            expect.objectContaining({ name: 'C Category' })
          ])
        })
      );
    });
  });

  describe('gridFlatten', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseObject: any;
    let dbServiceMock: MockDbService;

    beforeEach(() => {
      mockRequest = {
        body: {},
        query: {}
      };

      mockResponse = {
        json: jest.fn().mockImplementation((data) => {
          responseObject = data;
          return mockResponse;
        }),
        status: jest.fn().mockImplementation((code) => {
          responseObject = { ...responseObject, statusCode: code };
          return mockResponse;
        }),
        send: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis()
      };

      // Reset responseObject
      responseObject = {};

      // Mock DbService
      dbServiceMock = {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        grid: jest.fn().mockResolvedValue([]),
        collection: {
          aggregate: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([])
        }
      };

      // Update CategoryService to use mocked DbService
      categoryService = new CategoryService(dbServiceMock as DatabaseService);
    });

    it('should handle empty request body', async () => {
      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject).toEqual({
        rows: [],
        lastRow: 0,
        categories: {},
        category: {},
        mainCategory: {}
      });
    });

    it('should handle missing user info', async () => {
      mockRequest.body = { someData: true };

      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject).toEqual({
        rows: [],
        lastRow: 0,
        categories: {},
        category: {},
        mainCategory: {}
      });
    });

    it('should properly flatten nested categories', async () => {
      const mockCategories = [
        {
          _id: '1',
          name: 'Category 1',
          children: [
            {
              _id: '2',
              name: 'Child 1',
              parent: '1'
            }
          ]
        }
      ];

      (databaseService.find as jest.Mock).mockResolvedValue(mockCategories);
      (databaseService.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const req = {
        body: {
          startRow: 0,
          endRow: 100,
          sortModel: [] as GridSortItem[]
        }
      };

      await categoryService.gridFlatten(req, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should apply sorting correctly', async () => {
      const categories = [
        { name: 'B Category' },
        { name: 'A Category' },
        { name: 'C Category' }
      ];

      (databaseService.find as jest.Mock).mockResolvedValue(categories);
      (databaseService.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const sortModel: GridSortItem[] = [{ colId: 'name', sort: 'asc' }];
      await categoryService.gridFlatten(mockResponse, {
        sortModel
      });

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'A Category' }),
          expect.objectContaining({ name: 'B Category' }),
          expect.objectContaining({ name: 'C Category' })
        ])
      );
    });

    it('should apply pagination correctly', async () => {
      const categories = [
        { name: 'Category 1' },
        { name: 'Category 2' },
        { name: 'Category 3' }
      ];

      (databaseService.find as jest.Mock).mockResolvedValue(categories);
      (databaseService.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      await categoryService.gridFlatten(mockResponse, {
        startRow: 1,
        endRow: 2
      });

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Category 2' })
        ])
      );
    });
  });

  describe('flattenNestedStructure', () => {
    it('should flatten a simple category structure', () => {
      const categories = [{
        _id: '1',
        name: 'Root',
        active: true
      }];

      const result = categoryService['flattenNestedStructure'](categories);

      expect(result).toEqual([
        expect.objectContaining({
          _id: '1',
          name: 'Root',
          breadcrumb: 'Root'
        })
      ]);
    });

    it('should flatten a nested category structure', () => {
      const categories = [{
        _id: '1',
        name: 'Root',
        active: true,
        children: [{
          _id: '2',
          name: 'Child',
          active: true
        }]
      }];

      const result = categoryService['flattenNestedStructure'](categories);

      expect(result).toEqual([
        expect.objectContaining({
          _id: '1',
          name: 'Root',
          breadcrumb: 'Root'
        }),
        expect.objectContaining({
          _id: '2',
          name: 'Child',
          breadcrumb: 'Root > Child'
        })
      ]);
    });

    it('should handle multiple root categories', () => {
      const categories = [{
        _id: '1',
        name: 'Root1',
        active: true
      }, {
        _id: '2',
        name: 'Root2',
        active: true
      }];

      const result = categoryService['flattenNestedStructure'](categories);

      expect(result).toEqual([
        expect.objectContaining({
          _id: '1',
          name: 'Root1',
          breadcrumb: 'Root1'
        }),
        expect.objectContaining({
          _id: '2',
          name: 'Root2',
          breadcrumb: 'Root2'
        })
      ]);
    });

    it('should handle deeply nested categories', () => {
      const categories = [{
        _id: '1',
        name: 'Root',
        active: true,
        children: [{
          _id: '2',
          name: 'Child',
          active: true,
          children: [{
            _id: '3',
            name: 'Grandchild',
            active: true
          }]
        }]
      }];

      const result = categoryService['flattenNestedStructure'](categories);

      expect(result).toEqual([
        expect.objectContaining({
          _id: '1',
          name: 'Root',
          breadcrumb: 'Root'
        }),
        expect.objectContaining({
          _id: '2',
          name: 'Child',
          breadcrumb: 'Root > Child'
        }),
        expect.objectContaining({
          _id: '3',
          name: 'Grandchild',
          breadcrumb: 'Root > Child > Grandchild'
        })
      ]);
    });

    it('should handle null or undefined children', () => {
      const categories = [{
        _id: '1',
        name: 'Root',
        active: true,
        children: [null, undefined, {
          _id: '2',
          name: 'Child',
          active: true
        }]
      }];

      const result = categoryService['flattenNestedStructure'](categories);

      expect(result).toEqual([
        expect.objectContaining({
          _id: '1',
          name: 'Root',
          breadcrumb: 'Root'
        }),
        expect.objectContaining({
          _id: '2',
          name: 'Child',
          breadcrumb: 'Root > Child'
        })
      ]);
    });
  });

  describe('sortData', () => {
    it('should return the same data if no sort model is provided', () => {
      const data = [
        { name: 'B', active: true },
        { name: 'A', active: false },
        { name: 'C', active: true }
      ];
      const result = categoryService['sortData'](data, []);
      expect(result).toEqual(data);
    });

    it('should sort data in ascending order', () => {
      const sortModel = [{ colId: 'name', sort: 'asc' as const }];
      const data = [
        { name: 'B', active: true },
        { name: 'A', active: false },
        { name: 'C', active: true }
      ];

      const result = (categoryService as any).sortData(data, sortModel);
      expect(result[0].name).toBe('A');
      expect(result[1].name).toBe('B');
      expect(result[2].name).toBe('C');
    });

    it('should sort data in descending order', () => {
      const sortModel = [{ colId: 'name', sort: 'desc' as const }];
      const data = [
        { name: 'B', active: true },
        { name: 'A', active: false },
        { name: 'C', active: true }
      ];

      const result = (categoryService as any).sortData(data, sortModel);
      expect(result[0].name).toBe('C');
      expect(result[1].name).toBe('B');
      expect(result[2].name).toBe('A');
    });
  });
}); 