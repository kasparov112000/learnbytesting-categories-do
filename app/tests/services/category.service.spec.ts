import { Request, Response } from 'express';
import { GridSortItem } from '../../models/grid-sort.model';
import { DatabaseService } from '../../services/database.service';
import { CategoryService } from '../../services/category.service';
import { CategoryModel, ICategory } from '../../models/category.model';
import { Collection, Cursor } from 'mongodb';

// Mock crypto for UUID generation
jest.mock('crypto', () => ({
  randomUUID: () => '12345678-1234-5678-1234-567812345678'
}));

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let databaseService: jest.Mocked<DatabaseService>;
  let mockCollection: jest.Mocked<Collection<ICategory>>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      aggregate: jest.fn(),
    } as any;

    databaseService = {
      getCollection: jest.fn().mockReturnValue(mockCollection),
      create: jest.fn(),
      update: jest.fn(),
      grid: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      aggregate: jest.fn(),
    } as any;

    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };

    categoryService = new CategoryService(databaseService);
  });

  describe('getUpdatedCategory', () => {
    it('should update category with children correctly', async () => {
      const existingCategory = {
        _id: 'existing-id',
        name: 'Existing Category',
        children: [],
        createdDate: new Date(),
        active: true,
        parent: null,
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        modifiedDate: new Date()
      };

      const newChild = {
        _id: 'new-child-id',
        name: 'New Child',
        children: [],
        createdDate: new Date(),
        active: true,
        parent: 'existing-id',
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        modifiedDate: new Date()
      };

      const updatedCategory = await categoryService.getUpdatedCategory(existingCategory, newChild);

      expect(updatedCategory).toBeDefined();
      expect(updatedCategory.name).toBe('New Child');
      expect(updatedCategory.children).toHaveLength(0);
      expect(updatedCategory.parent).toBe('existing-id');
    });
  });

  describe('syncCreateCategories', () => {
    it('should create categories correctly', async () => {
      const req = {
        body: {
          categories: {
            name: 'Test Category',
            children: []
          }
        }
      };

      databaseService.findOne.mockResolvedValue(null);
      databaseService.insertOne.mockResolvedValue({ insertedId: 'test-id' });

      await categoryService.syncCreateCategories(req, mockRes as Response);

      expect(databaseService.insertOne).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should update existing categories', async () => {
      const existingCategory = {
        _id: '5d2f350d1f6a9b3184b82e56',
        name: 'Test Category',
        children: []
      };

      const req = {
        body: {
          categories: {
            _id: '5d2f350d1f6a9b3184b82e56',
            name: 'Updated Category',
            children: []
          }
        }
      };

      databaseService.findOne.mockResolvedValue(existingCategory);
      databaseService.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await categoryService.syncCreateCategories(req, mockRes as Response);

      expect(databaseService.updateOne).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should update an existing category with new children', async () => {
      const existingCategory = {
        _id: '5d2f350d1f6a9b3184b82e56',
        name: 'Test Category',
        children: []
      };

      const req = {
        body: {
          categories: {
            _id: '5d2f350d1f6a9b3184b82e56',
            name: 'Test Category',
            children: [
              {
                name: 'Child Category',
                children: []
              }
            ]
          }
        }
      };

      databaseService.findOne.mockResolvedValue(existingCategory);
      databaseService.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await categoryService.syncCreateCategories(req, mockRes as Response);

      expect(databaseService.updateOne).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle nested children correctly', async () => {
      const mockExistingCategory = {
        _id: '5d2f350d1f6a9b3184b82e56',
        name: 'Chess',
        children: [
          {
            name: 'Chess Openings',
            children: [],
            active: true,
            createUuid: 'chess-openings-uuid',
            createCreatedDate: new Date(),
            createdDate: new Date(),
            modifiedDate: new Date()
          }
        ],
        active: true,
        createCreatedDate: new Date(),
        createUuid: 'chess-uuid',
        createdDate: new Date(),
        modifiedDate: new Date()
      };

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

      databaseService.find.mockResolvedValue([mockExistingCategory]);
      databaseService.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await categoryService.syncCreateCategories(req, mockRes as Response);

      expect(databaseService.find).toHaveBeenCalledTimes(1);
      expect(databaseService.updateOne).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('grid', () => {
    it('should handle empty request body', async () => {
      const req = { body: null };
      await categoryService.grid(req.body, mockRes as Response, 'test-txn');
      expect(mockRes.json).toHaveBeenCalledWith({
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
        {
          _id: 'cat1',
          name: 'B Category',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: 'cat2',
          name: 'A Category',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      databaseService.find.mockResolvedValue(mockCategories);

      await categoryService.grid(req.body, mockRes as Response, 'test-txn');

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({ name: 'A Category' }),
            expect.objectContaining({ name: 'B Category' })
          ])
        })
      );
    });
  });

  describe('gridFlatten', () => {
    const mockCategory1 = {
      _id: 'cat1',
      name: 'A',
      active: true,
      createCreatedDate: new Date(),
      createUuid: '12345678-1234-5678-1234-567812345678',
      children: [],
      createdDate: new Date(),
      modifiedDate: new Date()
    };

    const mockCategory2 = {
      _id: 'cat2',
      name: 'B',
      active: true,
      createCreatedDate: new Date(),
      createUuid: '12345678-1234-5678-1234-567812345678',
      children: [],
      createdDate: new Date(),
      modifiedDate: new Date()
    };

    beforeEach(() => {
      const mockCursor = {
        toArray: jest.fn().mockResolvedValue([mockCategory1, mockCategory2])
      } as unknown as Cursor<ICategory>;
      mockCollection.find.mockReturnValue(mockCursor);
    });

    it('should handle empty request body', async () => {
      const req = { body: null };
      await categoryService.gridFlatten(req as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        rows: [],
        lastRow: 0,
        categories: {},
        category: {},
        mainCategory: {}
      });
    });

    it('should handle missing user info', async () => {
      const req = { body: { someData: true } };
      await categoryService.gridFlatten(req as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        rows: [],
        lastRow: 0,
        categories: {},
        category: {},
        mainCategory: {}
      });
    });

    it('should properly flatten nested categories', async () => {
      const req = {
        body: {
          userInfo: { userId: 'test-user' },
          startRow: 0,
          endRow: 100,
        },
      };

      const mockCategories = [
        {
          _id: 'cat1',
          name: 'Category 1',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [
            {
              _id: 'cat2',
              name: 'Category 2',
              active: true,
              createCreatedDate: new Date(),
              createUuid: '12345678-1234-5678-1234-567812345678',
              children: [],
              createdDate: new Date(),
              modifiedDate: new Date()
            }
          ],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      databaseService.find.mockResolvedValue(mockCategories);

      await categoryService.gridFlatten(req as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({ name: 'Category 1' }),
            expect.objectContaining({ name: 'Category 2' })
          ])
        })
      );
    });

    it('should apply sorting correctly', async () => {
      const req = {
        body: {
          userInfo: { userId: 'test-user' },
          sortModel: [{ colId: 'name', sort: 'asc' }] as GridSortItem[],
        },
      };

      const mockCategories = [
        {
          _id: 'cat1',
          name: 'Category A',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: 'cat2',
          name: 'Category B',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      databaseService.find.mockResolvedValue(mockCategories);

      await categoryService.gridFlatten(req as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({ name: 'Category A' }),
            expect.objectContaining({ name: 'Category B' })
          ])
        })
      );
    });

    it('should apply pagination correctly', async () => {
      const req = {
        body: {
          userInfo: { userId: 'test-user' },
          startRow: 1,
          endRow: 2,
        },
      };

      const mockCategories = [
        {
          _id: 'cat1',
          name: 'Category 1',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: 'cat2',
          name: 'Category 2',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      databaseService.find.mockResolvedValue(mockCategories);

      await categoryService.gridFlatten(req as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([
            expect.objectContaining({ name: 'Category 2' })
          ])
        })
      );
    });
  });

  describe('flattenNestedStructure', () => {
    it('should flatten a simple category structure', () => {
      const categories = [{
        _id: '1',
        name: 'Root',
        active: true,
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        children: [],
        createdDate: new Date(),
        modifiedDate: new Date()
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
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        children: [{
          _id: '2',
          name: 'Child',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }],
        createdDate: new Date(),
        modifiedDate: new Date()
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
        active: true,
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        children: [],
        createdDate: new Date(),
        modifiedDate: new Date()
      }, {
        _id: '2',
        name: 'Root2',
        active: true,
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        children: [],
        createdDate: new Date(),
        modifiedDate: new Date()
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
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        children: [{
          _id: '2',
          name: 'Child',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [{
            _id: '3',
            name: 'Grandchild',
            active: true,
            createCreatedDate: new Date(),
            createUuid: '12345678-1234-5678-1234-567812345678',
            children: [],
            createdDate: new Date(),
            modifiedDate: new Date()
          }],
          createdDate: new Date(),
          modifiedDate: new Date()
        }],
        createdDate: new Date(),
        modifiedDate: new Date()
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
        createCreatedDate: new Date(),
        createUuid: '12345678-1234-5678-1234-567812345678',
        children: [null, undefined, {
          _id: '2',
          name: 'Child',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }],
        createdDate: new Date(),
        modifiedDate: new Date()
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
        {
          _id: '1',
          name: 'B',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: '2',
          name: 'A',
          active: false,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: '3',
          name: 'C',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];
      const result = categoryService['sortData'](data, []);
      expect(result).toEqual(data);
    });

    it('should sort data in ascending order', () => {
      const sortModel: GridSortItem[] = [{ colId: 'name', sort: 'asc' }];
      const data = [
        {
          _id: '1',
          name: 'B',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: '2',
          name: 'A',
          active: false,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: '3',
          name: 'C',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      const result = categoryService['sortData'](data, sortModel);
      expect(result[0].name).toBe('A');
      expect(result[1].name).toBe('B');
      expect(result[2].name).toBe('C');
    });

    it('should sort data in descending order', () => {
      const sortModel: GridSortItem[] = [{ colId: 'name', sort: 'desc' }];
      const data = [
        {
          _id: '1',
          name: 'B',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: '2',
          name: 'A',
          active: false,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        },
        {
          _id: '3',
          name: 'C',
          active: true,
          createCreatedDate: new Date(),
          createUuid: '12345678-1234-5678-1234-567812345678',
          children: [],
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      const result = categoryService['sortData'](data, sortModel);
      expect(result[0].name).toBe('C');
      expect(result[1].name).toBe('B');
      expect(result[2].name).toBe('A');
    });
  });
}); 