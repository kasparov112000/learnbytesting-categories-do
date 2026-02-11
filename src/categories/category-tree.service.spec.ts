import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CategoryTreeService } from './category-tree.service';

// ───────────────────────────────────────────────────────────
// Realistic nested chess category tree for testing
// ───────────────────────────────────────────────────────────

const dragon = {
  _id: 'dragon-001',
  name: 'Dragon Variation',
  createUuid: 'cuuid-dragon',
  createCreatedDate: new Date('2025-02-01'),
  createdDate: new Date('2025-02-01'),
  active: true,
  isActive: true,
  parent: 'sicilian-001',
  children: [],
  aiConfig: { domainContext: 'Dragon: sharp tactical play with opposite-side castling' },
};

const najdorf = {
  _id: 'najdorf-001',
  name: 'Najdorf Variation',
  createUuid: 'cuuid-najdorf',
  createCreatedDate: new Date('2025-02-01'),
  createdDate: new Date('2025-02-01'),
  active: true,
  isActive: true,
  parent: 'sicilian-001',
  children: [],
  aiConfig: { domainContext: 'Najdorf: most popular Sicilian line', systemPrompt: 'Focus on 6.Bg5 and 6.Be2 lines' },
};

const inactiveSveshnikov = {
  _id: 'svesh-001',
  name: 'Sveshnikov Variation',
  createUuid: 'cuuid-svesh',
  createCreatedDate: new Date('2025-03-01'),
  createdDate: new Date('2025-03-01'),
  active: false,
  isActive: false,
  parent: 'sicilian-001',
  children: [],
};

const sicilian = {
  _id: 'sicilian-001',
  name: 'Sicilian Defense',
  createUuid: 'cuuid-sicilian',
  createCreatedDate: new Date('2025-01-01'),
  createdDate: new Date('2025-01-01'),
  active: true,
  isActive: true,
  children: [dragon, najdorf, inactiveSveshnikov],
  aiConfig: { systemPrompt: 'You are a chess opening tutor for the Sicilian Defense', inheritToChildren: true },
};

const advance = {
  _id: 'advance-001',
  name: 'Advance Variation',
  createUuid: 'cuuid-advance',
  createCreatedDate: new Date('2025-04-01'),
  createdDate: new Date('2025-04-01'),
  active: true,
  isActive: true,
  parent: 'french-001',
  children: [],
};

const french = {
  _id: 'french-001',
  name: 'French Defense',
  createUuid: 'cuuid-french',
  createCreatedDate: new Date('2025-01-15'),
  createdDate: new Date('2025-01-15'),
  active: true,
  isActive: true,
  children: [advance],
  aiConfig: { systemPrompt: 'You are a chess opening tutor for the French Defense', domainContext: 'French pawn structures' },
};

const italian = {
  _id: 'italian-001',
  name: 'Italian Game',
  createUuid: 'cuuid-italian',
  createCreatedDate: new Date('2025-02-01'),
  createdDate: new Date('2025-02-01'),
  active: true,
  isActive: true,
  children: [],
};

const allCategories = [sicilian, french, italian];

// ───────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────

describe('CategoryTreeService', () => {
  let service: CategoryTreeService;
  let model: any;

  beforeEach(async () => {
    const mockModel: any = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryTreeService,
        { provide: getModelToken('Categories'), useValue: mockModel },
      ],
    }).compile();

    service = module.get<CategoryTreeService>(CategoryTreeService);
    model = module.get(getModelToken('Categories'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findInTree ───────────────────────────────────────

  describe('findInTree()', () => {
    it('should find a root-level category by id', () => {
      const result = service.findInTree(allCategories, 'sicilian-001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Sicilian Defense');
    });

    it('should find a nested child category', () => {
      const result = service.findInTree(allCategories, 'najdorf-001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Najdorf Variation');
    });

    it('should find a deeply nested category', () => {
      const result = service.findInTree(allCategories, 'dragon-001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Dragon Variation');
    });

    it('should return null when category is not found', () => {
      const result = service.findInTree(allCategories, 'nonexistent-id');
      expect(result).toBeNull();
    });

    it('should return null for empty categories array', () => {
      const result = service.findInTree([], 'sicilian-001');
      expect(result).toBeNull();
    });

    it('should find category in second root branch', () => {
      const result = service.findInTree(allCategories, 'advance-001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Advance Variation');
    });

    it('should find the last root in the list', () => {
      const result = service.findInTree(allCategories, 'italian-001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Italian Game');
    });

    it('should handle categories without children array', () => {
      const noChildrenCats = [{ _id: 'x', name: 'Test' }];
      const result = service.findInTree(noChildrenCats, 'x');
      expect(result.name).toBe('Test');
    });

    it('should handle string comparison correctly for mixed id types', () => {
      const result = service.findInTree(allCategories, String('sicilian-001'));
      expect(result).not.toBeNull();
    });
  });

  // ─── flattenNestedStructure ───────────────────────────

  describe('flattenNestedStructure()', () => {
    it('should flatten all categories into a flat array', () => {
      const result = service.flattenNestedStructure(allCategories);
      // sicilian + dragon + najdorf + sveshnikov + french + advance + italian = 7
      expect(result).toHaveLength(7);
    });

    it('should set depth=0 for root categories', () => {
      const result = service.flattenNestedStructure(allCategories);
      const sicilianFlat = result.find((c: any) => c._id === 'sicilian-001');
      expect(sicilianFlat.depth).toBe(0);
    });

    it('should set depth=1 for direct children', () => {
      const result = service.flattenNestedStructure(allCategories);
      const dragonFlat = result.find((c: any) => c._id === 'dragon-001');
      expect(dragonFlat.depth).toBe(1);
    });

    it('should produce correct breadcrumb for root category', () => {
      const result = service.flattenNestedStructure(allCategories);
      const sicilianFlat = result.find((c: any) => c._id === 'sicilian-001');
      expect(sicilianFlat.breadcrumb).toBe('Sicilian Defense');
    });

    it('should produce correct breadcrumb for child category', () => {
      const result = service.flattenNestedStructure(allCategories);
      const najdorfFlat = result.find((c: any) => c._id === 'najdorf-001');
      expect(najdorfFlat.breadcrumb).toBe('Sicilian Defense > Najdorf Variation');
    });

    it('should produce correct breadcrumb for categories under French', () => {
      const result = service.flattenNestedStructure(allCategories);
      const advanceFlat = result.find((c: any) => c._id === 'advance-001');
      expect(advanceFlat.breadcrumb).toBe('French Defense > Advance Variation');
    });

    it('should return empty array for empty input', () => {
      const result = service.flattenNestedStructure([]);
      expect(result).toEqual([]);
    });

    it('should preserve all original fields in flattened output', () => {
      const result = service.flattenNestedStructure(allCategories);
      const frenchFlat = result.find((c: any) => c._id === 'french-001');
      expect(frenchFlat.active).toBe(true);
      expect(frenchFlat.createUuid).toBe('cuuid-french');
    });

    it('should handle single category with no children', () => {
      const result = service.flattenNestedStructure([italian]);
      expect(result).toHaveLength(1);
      expect(result[0].breadcrumb).toBe('Italian Game');
      expect(result[0].depth).toBe(0);
    });

    it('should handle three-level deep nesting', () => {
      const subDragon = {
        _id: 'sub-dragon-001',
        name: 'Yugoslav Attack',
        children: [],
      };
      const dragonWithSub = { ...dragon, children: [subDragon] };
      const sicilianDeep = { ...sicilian, children: [dragonWithSub] };

      const result = service.flattenNestedStructure([sicilianDeep]);
      const yugoslav = result.find((c: any) => c._id === 'sub-dragon-001');
      expect(yugoslav.breadcrumb).toBe('Sicilian Defense > Dragon Variation > Yugoslav Attack');
      expect(yugoslav.depth).toBe(2);
    });
  });

  // ─── buildBreadCrumb ──────────────────────────────────

  describe('buildBreadCrumb()', () => {
    it('should return just the name for root category (no parent path)', () => {
      const result = service.buildBreadCrumb({ name: 'Sicilian Defense' });
      expect(result).toBe('Sicilian Defense');
    });

    it('should return parentPath > name for nested category', () => {
      const result = service.buildBreadCrumb({ name: 'Najdorf Variation' }, 'Sicilian Defense');
      expect(result).toBe('Sicilian Defense > Najdorf Variation');
    });

    it('should handle deeply nested breadcrumbs', () => {
      const result = service.buildBreadCrumb(
        { name: 'Yugoslav Attack' },
        'Sicilian Defense > Dragon Variation',
      );
      expect(result).toBe('Sicilian Defense > Dragon Variation > Yugoslav Attack');
    });

    it('should handle empty parent path like a root category', () => {
      const result = service.buildBreadCrumb({ name: 'Italian Game' }, '');
      expect(result).toBe('Italian Game');
    });
  });

  // ─── filterNonActiveChildren ──────────────────────────

  describe('filterNonActiveChildren()', () => {
    it('should remove inactive children', () => {
      const result = service.filterNonActiveChildren(sicilian);
      expect(result.children).toHaveLength(2);
      const names = result.children.map((c: any) => c.name);
      expect(names).toContain('Dragon Variation');
      expect(names).toContain('Najdorf Variation');
      expect(names).not.toContain('Sveshnikov Variation');
    });

    it('should keep active children', () => {
      const result = service.filterNonActiveChildren(sicilian);
      expect(result.children.every((c: any) => c.active !== false)).toBe(true);
    });

    it('should handle category with no children', () => {
      const result = service.filterNonActiveChildren(italian);
      expect(result.children).toEqual([]);
    });

    it('should handle null/undefined category', () => {
      expect(service.filterNonActiveChildren(null)).toBeNull();
      expect(service.filterNonActiveChildren(undefined)).toBeUndefined();
    });

    it('should recursively filter nested inactive children', () => {
      const deepInactive = {
        _id: 'deep-inactive',
        name: 'Deprecated Sub-line',
        active: false,
        children: [],
      };
      const dragonWithDeep = { ...dragon, children: [deepInactive] };
      const sicilianDeep = {
        ...sicilian,
        children: [dragonWithDeep, najdorf, inactiveSveshnikov],
      };

      const result = service.filterNonActiveChildren(sicilianDeep);
      // Sveshnikov removed at first level
      expect(result.children).toHaveLength(2);
      // Deprecated Sub-line removed from Dragon's children
      const dragonResult = result.children.find((c: any) => c._id === 'dragon-001');
      expect(dragonResult.children).toHaveLength(0);
    });

    it('should not modify the original object', () => {
      const originalLength = sicilian.children.length;
      service.filterNonActiveChildren(sicilian);
      expect(sicilian.children.length).toBe(originalLength);
    });
  });

  // ─── getUpdatedCategory ───────────────────────────────

  describe('getUpdatedCategory()', () => {
    it('should preserve immutable fields (_id, createdDate, createCreatedDate)', () => {
      const existing = {
        _id: 'original-id',
        createdDate: new Date('2025-01-01'),
        createCreatedDate: new Date('2025-01-01'),
        createUuid: 'original-uuid',
        name: 'Old Name',
      };
      const newData = {
        _id: 'attempted-override',
        createdDate: new Date('2025-12-31'),
        name: 'New Name',
      };

      const result = service.getUpdatedCategory(existing, newData);

      expect(result._id).toBe('original-id');
      expect(result.createdDate).toEqual(new Date('2025-01-01'));
      expect(result.createCreatedDate).toEqual(new Date('2025-01-01'));
      expect(result.name).toBe('New Name');
    });

    it('should preserve createUuid from existing when present', () => {
      const existing = { _id: 'x', createUuid: 'existing-uuid', createdDate: null, createCreatedDate: null };
      const newData = { createUuid: 'new-uuid' };

      const result = service.getUpdatedCategory(existing, newData);
      expect(result.createUuid).toBe('existing-uuid');
    });

    it('should use newData createUuid when existing lacks one', () => {
      const existing = { _id: 'x', createUuid: undefined, createdDate: null, createCreatedDate: null };
      const newData = { createUuid: 'new-uuid' };

      const result = service.getUpdatedCategory(existing, newData);
      expect(result.createUuid).toBe('new-uuid');
    });

    it('should merge children matching by createUuid', () => {
      const existing = {
        _id: 'parent-1',
        createdDate: new Date(),
        createCreatedDate: new Date(),
        children: [
          { _id: 'child-1', createUuid: 'cu-1', name: 'Old Dragon', createdDate: new Date('2025-01-01'), createCreatedDate: new Date('2025-01-01') },
        ],
      };
      const newData = {
        children: [
          { _id: 'child-1-override', createUuid: 'cu-1', name: 'Updated Dragon' },
        ],
      };

      const result = service.getUpdatedCategory(existing, newData);

      expect(result.children[0]._id).toBe('child-1'); // preserved from existing
      expect(result.children[0].name).toBe('Updated Dragon'); // updated
      expect(result.children[0].parent).toBe('parent-1');
    });

    it('should assign new _id and createdDate to new children', () => {
      const existing = {
        _id: 'parent-1',
        createdDate: new Date(),
        createCreatedDate: new Date(),
        children: [],
      };
      const newData = {
        children: [
          { createUuid: 'brand-new', name: 'Brand New Variation' },
        ],
      };

      const result = service.getUpdatedCategory(existing, newData);

      expect(result.children[0]._id).toBeDefined();
      expect(result.children[0].createdDate).toBeInstanceOf(Date);
      expect(result.children[0].parent).toBe('parent-1');
    });

    it('should handle categories without children arrays', () => {
      const existing = { _id: 'x', createdDate: null, createCreatedDate: null };
      const newData = { name: 'Updated' };

      const result = service.getUpdatedCategory(existing, newData);
      expect(result.name).toBe('Updated');
      expect(result._id).toBe('x');
    });
  });

  // ─── createNewCategory ────────────────────────────────

  describe('createNewCategory()', () => {
    it('should create a nested category under the correct parent', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ ...sicilian }]) });
      model.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.createNewCategory(
        { name: 'Taimanov Variation', parent: 'sicilian-001' },
        {},
      );

      expect(result.name).toBe('Taimanov Variation');
      expect(result.parent).toBe('sicilian-001');
      expect(result._id).toBeDefined();
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('sicilian-001', expect.any(Object));
    });

    it('should create as root when parent is not found', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      model.create.mockResolvedValue({
        toObject: () => ({ name: 'Orphan Opening', _id: 'orphan-001' }),
      });

      const result = await service.createNewCategory(
        { name: 'Orphan Opening', parent: 'nonexistent-parent' },
        {},
      );

      expect(model.create).toHaveBeenCalled();
      expect(result.name).toBe('Orphan Opening');
    });

    it('should set createdByGuid from request user', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ ...sicilian }]) });
      model.findByIdAndUpdate.mockResolvedValue(undefined);

      const req = { body: { currentUser: { info: { guid: 'user-abc' } } } };
      const result = await service.createNewCategory(
        { name: 'Paulsen Variation', parent: 'sicilian-001' },
        req,
      );

      expect(result.createdByGuid).toBe('user-abc');
      expect(result.modifiedByGuid).toBe('user-abc');
    });

    it('should generate UUIDs for _id and createUuid when not provided', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ ...sicilian }]) });
      model.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.createNewCategory(
        { name: 'Accelerated Dragon', parent: 'sicilian-001' },
        {},
      );

      expect(result._id).toBeDefined();
      expect(result.createUuid).toBeDefined();
      expect(typeof result._id).toBe('string');
    });

    it('should default active and isActive to true', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ ...sicilian }]) });
      model.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.createNewCategory(
        { name: 'Kan Variation', parent: 'sicilian-001' },
        {},
      );

      expect(result.active).toBe(true);
      expect(result.isActive).toBe(true);
    });

    it('should honour explicit active=false', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ ...sicilian }]) });
      model.findByIdAndUpdate.mockResolvedValue(undefined);

      const result = await service.createNewCategory(
        { name: 'Deprecated Line', parent: 'sicilian-001', active: false, isActive: false },
        {},
      );

      expect(result.active).toBe(false);
      expect(result.isActive).toBe(false);
    });
  });

  // ─── resolveAiConfig ──────────────────────────────────

  describe('resolveAiConfig()', () => {
    it('should return the category own config when it has no parent', () => {
      const result = service.resolveAiConfig(allCategories, sicilian);
      expect(result.systemPrompt).toBe('You are a chess opening tutor for the Sicilian Defense');
      expect(result.inheritToChildren).toBe(true);
    });

    it('should merge parent and child configs (child overrides)', () => {
      const result = service.resolveAiConfig(allCategories, najdorf);
      // Najdorf has its own systemPrompt which should override Sicilian's
      expect(result.systemPrompt).toBe('Focus on 6.Bg5 and 6.Be2 lines');
      // Najdorf has its own domainContext
      expect(result.domainContext).toBe('Najdorf: most popular Sicilian line');
      // inheritToChildren comes from parent
      expect(result.inheritToChildren).toBe(true);
    });

    it('should merge parent config with child that only has domainContext', () => {
      const result = service.resolveAiConfig(allCategories, dragon);
      // Dragon does not have systemPrompt, so inherits from Sicilian
      expect(result.systemPrompt).toBe('You are a chess opening tutor for the Sicilian Defense');
      // Dragon has its own domainContext
      expect(result.domainContext).toBe('Dragon: sharp tactical play with opposite-side castling');
    });

    it('should return empty config for category with no aiConfig and no parent', () => {
      const result = service.resolveAiConfig(allCategories, italian);
      expect(result).toEqual({});
    });

    it('should handle category with parent that has no aiConfig', () => {
      const childOfItalian = {
        _id: 'giuoco-001',
        name: 'Giuoco Piano',
        parent: 'italian-001',
        aiConfig: { domainContext: 'Quiet positional play' },
        children: [],
      };
      const catsWithChild = [
        { ...italian, children: [childOfItalian] },
        french,
      ];

      const result = service.resolveAiConfig(catsWithChild, childOfItalian);
      expect(result.domainContext).toBe('Quiet positional play');
      expect(result.systemPrompt).toBeUndefined();
    });

    it('should handle nested object merging in AI config', () => {
      const parent = {
        _id: 'p1',
        name: 'Parent',
        aiConfig: {
          flashcardConfig: { additionalPrompt: 'from parent', defaultDifficulty: 3 },
        },
        children: [],
      };
      const child = {
        _id: 'c1',
        name: 'Child',
        parent: 'p1',
        aiConfig: {
          flashcardConfig: { defaultDifficulty: 5 },
        },
        children: [],
      };
      const cats = [{ ...parent, children: [child] }];

      const result = service.resolveAiConfig(cats, child);
      expect(result.flashcardConfig.defaultDifficulty).toBe(5);
      expect(result.flashcardConfig.additionalPrompt).toBe('from parent');
    });
  });
});
