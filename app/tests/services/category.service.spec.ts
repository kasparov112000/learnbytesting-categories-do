import { Category } from 'hipolito-models';
import { DbMicroServiceBase } from '../../services/db-micro-service-base';
import { CategoryService } from '../../services/category.service';
import { DbService } from '../../services/db.service';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { GridSortItem } from '../../models';

jest.mock('../../services/db.service');

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockDbService: jest.Mocked<DbService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    mockDbService = new DbService() as jest.Mocked<DbService>;
    categoryService = new CategoryService(mockDbService);

    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpdatedCategory', () => {
    it('should update a category with new values while preserving existing IDs and dates', () => {
      const existingCategory = new Category();
      existingCategory._id = new ObjectId('5d2f350d1f6a9b3184b82e56').toString();
      existingCategory.name = 'Existing Category';
      existingCategory.createdDate = new Date('2023-01-01');
      existingCategory.modifiedDate = new Date('2023-01-02');
      existingCategory.children = [];
      existingCategory.active = true;
      existingCategory.createUuid = 'test-uuid';
      existingCategory.createCreatedDate = new Date();

      const newCategory = new Category();
      newCategory.name = 'Updated Category';
      newCategory.active = true;
      newCategory.children = [];
      newCategory.createUuid = 'new-uuid';
      newCategory.createCreatedDate = new Date();

      const updatedCategory = categoryService.getUpdatedCategory(existingCategory, newCategory);

      expect(updatedCategory._id).toEqual(existingCategory._id);
      expect(updatedCategory.name).toEqual(newCategory.name);
      expect(updatedCategory.createdDate).toEqual(existingCategory.createdDate);
      expect(updatedCategory.modifiedDate).not.toEqual(existingCategory.modifiedDate);
      expect(updatedCategory.active).toEqual(newCategory.active);
      expect(updatedCategory.children).toEqual([]);
    });

    it('should handle children categories correctly', () => {
      const existingCategory = new Category();
      existingCategory._id = new ObjectId('5d2f350d1f6a9b3184b82e56').toString();
      existingCategory.name = 'Parent Category';
      existingCategory.active = true;
      existingCategory.createUuid = 'parent-uuid';
      existingCategory.createCreatedDate = new Date();
      existingCategory.children = [
        {
          _id: new ObjectId('5d2f350d1f6a9b3184b82e57').toString(),
          name: 'Existing Child',
          parent: existingCategory._id,
          children: [],
          active: true,
          createUuid: 'child-uuid',
          createCreatedDate: new Date(),
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      const newCategory = new Category();
      newCategory.name = 'Updated Parent';
      newCategory.active = true;
      newCategory.createUuid = 'new-parent-uuid';
      newCategory.createCreatedDate = new Date();
      newCategory.children = [
        {
          name: 'New Child',
          children: [],
          active: true,
          createUuid: 'new-child-uuid',
          createCreatedDate: new Date(),
          createdDate: new Date(),
          modifiedDate: new Date()
        }
      ];

      const updatedCategory = categoryService.getUpdatedCategory(existingCategory, newCategory);

      expect(updatedCategory.children.length).toBe(1);
      expect(updatedCategory.children[0].name).toBe('New Child');
      expect(updatedCategory.children[0].parent).toBe(existingCategory._id);
    });
  });

  describe('syncCreateCategories', () => {
    it('should update an existing category with new children', async () => {
      const mockExistingCategory = new Category();
      mockExistingCategory._id = new ObjectId('5d2f350d1f6a9b3184b82e56').toString();
      mockExistingCategory.name = 'Chess';
      mockExistingCategory.children = [];

      const req = {
        body: {
          categories: {
            _id: mockExistingCategory._id,
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
            ]
          }
        }
      };

      const res = {
        send: jest.fn()
      };

      mockDbService.find = jest.fn().mockResolvedValue([mockExistingCategory]);
      mockDbService.update = jest.fn().mockResolvedValue({
        ...mockExistingCategory,
        children: req.body.categories.children
      });

      await categoryService.syncCreateCategories(req, res);

      expect(mockDbService.find).toHaveBeenCalledTimes(1);
      expect(mockDbService.update).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalled();
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

      mockDbService.find = jest.fn().mockResolvedValue([mockExistingCategory]);
      mockDbService.update = jest.fn().mockResolvedValue({
        ...mockExistingCategory,
        children: req.body.categories.children
      });

      await categoryService.syncCreateCategories(req, res);

      expect(mockDbService.find).toHaveBeenCalledTimes(1);
      expect(mockDbService.update).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('gridFlatten', () => {
    it('should handle empty request body', async () => {
      mockRequest = {
        body: null
      };

      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject).toEqual({
        rows: [],
        lastRow: 0,
        categories: {},
        mainCategory: {},
        category: {},
      });
    });

    it('should handle missing user info', async () => {
      mockRequest = {
        body: {
          params: {}
        }
      };

      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject).toEqual({
        rows: [],
        lastRow: 0,
        categories: {},
        mainCategory: {},
        category: {},
      });
    });

    it('should properly flatten nested categories', async () => {
      const mockCategories = [{
        _id: '1',
        name: 'Root',
        active: true,
        children: [{
          _id: '2',
          name: 'Child1',
          active: true,
          children: [{
            _id: '3',
            name: 'Grandchild1',
            active: true
          }]
        }]
      }];

      mockDbService.find.mockResolvedValue(mockCategories);

      mockRequest = {
        body: {
          userInfo: {
            roles: [{ name: 'System Administrator' }]
          }
        }
      };

      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject.rows).toEqual(expect.arrayContaining([
        expect.objectContaining({
          _id: '1',
          name: 'Root',
          breadcrumb: 'Root'
        }),
        expect.objectContaining({
          _id: '2',
          name: 'Child1',
          breadcrumb: 'Root > Child1'
        }),
        expect.objectContaining({
          _id: '3',
          name: 'Grandchild1',
          breadcrumb: 'Root > Child1 > Grandchild1'
        })
      ]));
    });

    it('should apply sorting correctly', async () => {
      const mockCategories = [{
        _id: '1',
        name: 'B Category',
        active: true
      }, {
        _id: '2',
        name: 'A Category',
        active: true
      }];

      mockDbService.find.mockResolvedValue(mockCategories);

      mockRequest = {
        body: {
          userInfo: {
            roles: [{ name: 'System Administrator' }]
          },
          params: {
            sortModel: [{
              colId: 'name',
              sort: 'asc'
            }]
          }
        }
      };

      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject.rows[0].name).toBe('A Category');
      expect(responseObject.rows[1].name).toBe('B Category');
    });

    it('should apply pagination correctly', async () => {
      const mockCategories = Array.from({ length: 5 }, (_, i) => ({
        _id: String(i + 1),
        name: `Category ${i + 1}`,
        active: true
      }));

      mockDbService.find.mockResolvedValue(mockCategories);

      mockRequest = {
        body: {
          userInfo: {
            roles: [{ name: 'System Administrator' }]
          },
          params: {
            startRow: '1',
            endRow: '3'
          }
        }
      };

      await categoryService.gridFlatten(mockRequest as Request, mockResponse as Response);

      expect(responseObject.rows.length).toBe(2);
      expect(responseObject.lastRow).toBe(5);
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
      const data = [
        { name: 'B', active: true },
        { name: 'A', active: false },
        { name: 'C', active: true }
      ];
      const sortModel: { colId: string; sort: 'asc' | 'desc' }[] = [
        { colId: 'name', sort: 'asc' }
      ];
      const result = categoryService['sortData'](data, sortModel);
      expect(result).toEqual([
        { name: 'A', active: false },
        { name: 'B', active: true },
        { name: 'C', active: true }
      ]);
    });

    it('should sort data in descending order', () => {
      const data = [
        { name: 'B', active: true },
        { name: 'A', active: false },
        { name: 'C', active: true }
      ];
      const sortModel: { colId: string; sort: 'asc' | 'desc' }[] = [
        { colId: 'name', sort: 'desc' }
      ];
      const result = categoryService['sortData'](data, sortModel);
      expect(result).toEqual([
        { name: 'C', active: true },
        { name: 'B', active: true },
        { name: 'A', active: false }
      ]);
    });
  });
}); 