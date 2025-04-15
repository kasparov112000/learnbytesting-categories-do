import { Category } from 'hipolito-models';
import { DbMicroServiceBase } from '../../services/db-micro-service-base';
import { CategoryService } from '../../services/category.service';
import { DbService } from '../../services/db.service';
import { ObjectId } from 'mongodb';

jest.mock('../../services/db.service');

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockDbService: jest.Mocked<DbService>;

  beforeEach(() => {
    mockDbService = new DbService() as jest.Mocked<DbService>;
    categoryService = new CategoryService(mockDbService);
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
}); 