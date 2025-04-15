import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category';
import { DbService } from '../../services/db-service-base';
import { DbMicroServiceBase } from '../../services/db-micro-service-base';

jest.mock('../../services/db-service-base');

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

  describe('updateExistingCategory', () => {
    it('should update a category with its children correctly', async () => {
      const existingCategory = new Category();
      Object.assign(existingCategory, {
        _id: '123',
        name: 'Chess',
        children: [],
        active: true
      });

      const createCategory = new Category();
      Object.assign(createCategory, {
        _id: '123',
        name: 'Chess',
        children: [
          {
            _id: '456',
            name: 'Chess Openings',
            children: [],
            parent: '123',
            active: true
          }
        ],
        active: true
      });

      mockDbService.update.mockResolvedValue({
        ...existingCategory,
        children: createCategory.children
      });

      const result = await (categoryService as any).updateExistingCategory(existingCategory, createCategory);

      expect(result).toBeDefined();
      expect(result.children).toHaveLength(1);
      expect(result.children[0].name).toBe('Chess Openings');
      expect(mockDbService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle nested children correctly', async () => {
      const existingCategory = new Category();
      Object.assign(existingCategory, {
        _id: '123',
        name: 'Chess',
        children: [],
        active: true
      });

      const createCategory = new Category();
      Object.assign(createCategory, {
        _id: '123',
        name: 'Chess',
        children: [
          {
            _id: '456',
            name: 'Chess Openings',
            children: [
              {
                _id: '789',
                name: "Queen's Pawn Opening",
                children: [],
                parent: '456',
                active: true
              }
            ],
            parent: '123',
            active: true
          }
        ],
        active: true
      });

      mockDbService.update.mockResolvedValue({
        ...existingCategory,
        children: createCategory.children
      });

      const result = await (categoryService as any).updateExistingCategory(existingCategory, createCategory);

      expect(result).toBeDefined();
      expect(result.children).toHaveLength(1);
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].name).toBe("Queen's Pawn Opening");
      expect(mockDbService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncCreateCategories', () => {
    it('should create or update categories based on request', async () => {
      const req = {
        body: {
          categories: {
            _id: '123',
            name: 'Chess',
            children: [
              {
                _id: '456',
                name: 'Chess Openings',
                children: [],
                parent: '123',
                active: true
              }
            ],
            active: true
          }
        }
      };

      const mockExistingCategory = new Category();
      Object.assign(mockExistingCategory, {
        _id: '123',
        name: 'Chess',
        children: [],
        active: true
      });

      mockDbService.findOne.mockResolvedValue(mockExistingCategory);
      mockDbService.update.mockResolvedValue({
        ...mockExistingCategory,
        children: req.body.categories.children
      });

      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await categoryService.syncCreateCategories(req, res);

      expect(mockDbService.findOne).toHaveBeenCalledTimes(1);
      expect(mockDbService.update).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalled();
    });
  });
}); 