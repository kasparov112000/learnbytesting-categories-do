import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CategoryGridService } from './category-grid.service';
import { CategoryTreeService } from './category-tree.service';

// ───────────────────────────────────────────────────────────
// Helpers & test data
// ───────────────────────────────────────────────────────────

const makeFlatCat = (id: string, name: string, depth: number, breadcrumb: string, extras: any = {}) => ({
  _id: id,
  name,
  depth,
  breadcrumb,
  active: true,
  isActive: true,
  children: [],
  ...extras,
});

// Flattened categories mimicking the output of flattenNestedStructure
const flatCategories = [
  makeFlatCat('sicilian-001', 'Sicilian Defense', 0, 'Sicilian Defense', { eco: 'B20' }),
  makeFlatCat('najdorf-001', 'Najdorf Variation', 1, 'Sicilian Defense > Najdorf Variation', { eco: 'B90' }),
  makeFlatCat('dragon-001', 'Dragon Variation', 1, 'Sicilian Defense > Dragon Variation', { eco: 'B70' }),
  makeFlatCat('french-001', 'French Defense', 0, 'French Defense', { eco: 'C00' }),
  makeFlatCat('advance-001', 'Advance Variation', 1, 'French Defense > Advance Variation', { eco: 'C02' }),
  makeFlatCat('italian-001', 'Italian Game', 0, 'Italian Game', { eco: 'C50' }),
  makeFlatCat('ruylopez-001', 'Ruy Lopez', 0, 'Ruy Lopez', { eco: 'C60' }),
  makeFlatCat('berlin-001', 'Berlin Defense', 1, 'Ruy Lopez > Berlin Defense', { eco: 'C65' }),
  makeFlatCat('marshall-001', 'Marshall Attack', 1, 'Ruy Lopez > Marshall Attack', { eco: 'C89' }),
  makeFlatCat('caro-001', "Caro-Kann Defense", 0, "Caro-Kann Defense", { eco: 'B10' }),
];

// Nested (raw DB) categories - roots only
const nestedCategories = [
  {
    _id: 'sicilian-001',
    name: 'Sicilian Defense',
    active: true,
    children: [
      { _id: 'najdorf-001', name: 'Najdorf Variation', active: true, children: [] },
      { _id: 'dragon-001', name: 'Dragon Variation', active: true, children: [] },
    ],
  },
  {
    _id: 'french-001',
    name: 'French Defense',
    active: true,
    children: [
      { _id: 'advance-001', name: 'Advance Variation', active: true, children: [] },
    ],
  },
  { _id: 'italian-001', name: 'Italian Game', active: true, children: [] },
  {
    _id: 'ruylopez-001',
    name: 'Ruy Lopez',
    active: true,
    children: [
      { _id: 'berlin-001', name: 'Berlin Defense', active: true, children: [] },
      { _id: 'marshall-001', name: 'Marshall Attack', active: true, children: [] },
    ],
  },
  { _id: 'caro-001', name: "Caro-Kann Defense", active: true, children: [] },
];

// ───────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────

describe('CategoryGridService', () => {
  let service: CategoryGridService;
  let model: any;
  let treeService: any;

  beforeEach(async () => {
    const mockModel: any = {
      find: jest.fn(),
    };

    const mockTreeService = {
      flattenNestedStructure: jest.fn().mockReturnValue([...flatCategories]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryGridService,
        { provide: getModelToken('Categories'), useValue: mockModel },
        { provide: CategoryTreeService, useValue: mockTreeService },
      ],
    }).compile();

    service = module.get<CategoryGridService>(CategoryGridService);
    model = module.get(getModelToken('Categories'));
    treeService = module.get(CategoryTreeService);

    // Default mock: return nested categories from DB
    model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(nestedCategories) });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── grid ─────────────────────────────────────────────

  describe('grid()', () => {
    it('should return paginated rows and lastRow count', async () => {
      const result = await service.grid({ startRow: 0, endRow: 5 }, {});

      expect(result.rows).toHaveLength(5);
      expect(result.lastRow).toBe(10);
    });

    it('should default startRow=0 and endRow=100', async () => {
      const result = await service.grid({}, {});

      expect(result.rows).toHaveLength(10);
      expect(result.lastRow).toBe(10);
    });

    it('should apply pagination correctly (page 2)', async () => {
      const result = await service.grid({ startRow: 3, endRow: 6 }, {});

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].name).toBe('French Defense');
    });

    it('should return empty rows when startRow exceeds data length', async () => {
      const result = await service.grid({ startRow: 100, endRow: 200 }, {});

      expect(result.rows).toHaveLength(0);
      expect(result.lastRow).toBe(10);
    });

    it('should flatten and filter categories from DB', async () => {
      const result = await service.grid({}, {});

      expect(model.find).toHaveBeenCalled();
      expect(treeService.flattenNestedStructure).toHaveBeenCalledWith(nestedCategories);
      expect(result.lastRow).toBe(10);
    });

    it('should apply sort model when provided', async () => {
      const result = await service.grid(
        { startRow: 0, endRow: 10, sortModel: [{ colId: 'name', sort: 'asc' }] },
        {},
      );

      const names = result.rows.map((r: any) => r.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('should apply text filter - contains', async () => {
      const result = await service.grid(
        {
          startRow: 0,
          endRow: 100,
          filterModel: {
            name: { filterType: 'text', type: 'contains', filter: 'Defense' },
          },
        },
        {},
      );

      expect(result.rows.every((r: any) => r.name.toLowerCase().includes('defense'))).toBe(true);
      expect(result.lastRow).toBe(4); // Sicilian, French, Berlin (not Defense in name), Caro-Kann
    });
  });

  // ─── gridFlatten ──────────────────────────────────────

  describe('gridFlatten()', () => {
    it('should return paginated flattened rows', async () => {
      const result = await service.gridFlatten({ startRow: 0, endRow: 3 }, {});

      expect(result.rows).toHaveLength(3);
      expect(result.lastRow).toBe(10);
    });

    it('should default startRow=0 and endRow=100', async () => {
      const result = await service.gridFlatten({}, {});

      expect(result.rows).toHaveLength(10);
    });

    it('should apply filters to flattened data', async () => {
      const result = await service.gridFlatten(
        {
          filterModel: {
            name: { filterType: 'text', type: 'startsWith', filter: 'French' },
          },
        },
        {},
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('French Defense');
    });

    it('should apply sorting to flattened data', async () => {
      const result = await service.gridFlatten(
        { sortModel: [{ colId: 'name', sort: 'desc' }] },
        {},
      );

      const names = result.rows.map((r: any) => r.name);
      const descSorted = [...names].sort().reverse();
      expect(names).toEqual(descSorted);
    });
  });

  // ─── search ───────────────────────────────────────────

  describe('search()', () => {
    it('should find categories matching the search term', async () => {
      const result = await service.search('Dragon');

      expect(result.result).toHaveLength(1);
      expect(result.result[0].name).toBe('Dragon Variation');
    });

    it('should be case-insensitive', async () => {
      const result = await service.search('sicilian');

      expect(result.result.length).toBeGreaterThanOrEqual(1);
      expect(result.result[0].name).toBe('Sicilian Defense');
    });

    it('should return empty for terms shorter than 2 chars', async () => {
      const result = await service.search('D');

      expect(result.result).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should return empty for empty string', async () => {
      const result = await service.search('');

      expect(result.result).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should return empty for null/undefined term', async () => {
      const result = await service.search(null as any);

      expect(result.result).toEqual([]);
    });

    it('should return count matching results length', async () => {
      const result = await service.search('Variation');

      expect(result.count).toBe(result.result.length);
      // Najdorf Variation, Dragon Variation, Advance Variation = 3
      expect(result.count).toBe(3);
    });

    it('should return empty when no matches found', async () => {
      const result = await service.search('Zzyzzyva');

      expect(result.result).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should match partial words', async () => {
      const result = await service.search('Ital');

      expect(result.result).toHaveLength(1);
      expect(result.result[0].name).toBe('Italian Game');
    });
  });

  // ─── sortData ─────────────────────────────────────────

  describe('sortData()', () => {
    it('should sort ascending by name', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, [{ colId: 'name', sort: 'asc' }]);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].name >= result[i - 1].name).toBe(true);
      }
    });

    it('should sort descending by name', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, [{ colId: 'name', sort: 'desc' }]);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].name <= result[i - 1].name).toBe(true);
      }
    });

    it('should sort by depth ascending', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, [{ colId: 'depth', sort: 'asc' }]);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].depth >= result[i - 1].depth).toBe(true);
      }
    });

    it('should handle multi-column sort', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, [
        { colId: 'depth', sort: 'asc' },
        { colId: 'name', sort: 'asc' },
      ]);

      // All depth-0 items should come first
      const depthZero = result.filter((r: any) => r.depth === 0);
      const depthOne = result.filter((r: any) => r.depth === 1);
      expect(result.indexOf(depthOne[0])).toBeGreaterThan(result.indexOf(depthZero[depthZero.length - 1]));
    });

    it('should return data unchanged when sortModel is empty', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, []);

      expect(result).toEqual(data);
    });

    it('should return data unchanged when sortModel is null', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, null as any);

      expect(result).toEqual(data);
    });

    it('should not mutate the original array', () => {
      const data = [...flatCategories];
      const originalFirst = data[0];
      service.sortData(data, [{ colId: 'name', sort: 'desc' }]);
      expect(data[0]).toBe(originalFirst);
    });

    it('should support "field" property in addition to "colId"', () => {
      const data = [...flatCategories];
      const result = service.sortData(data, [{ field: 'name', sort: 'asc' }]);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].name >= result[i - 1].name).toBe(true);
      }
    });
  });

  // ─── Text filters (tested via grid) ──────────────────

  describe('text filters', () => {
    it('contains: matches categories containing substring', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'contains', filter: 'Variation' } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.name.includes('Variation'))).toBe(true);
      expect(result.lastRow).toBe(3);
    });

    it('notContains: excludes categories containing substring', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'notContains', filter: 'Variation' } },
        },
        {},
      );
      expect(result.rows.every((r: any) => !r.name.includes('Variation'))).toBe(true);
      expect(result.lastRow).toBe(7);
    });

    it('equals: exact match (case-insensitive)', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'equals', filter: 'Italian Game' } },
        },
        {},
      );
      expect(result.lastRow).toBe(1);
      expect(result.rows[0].name).toBe('Italian Game');
    });

    it('notEqual: excludes exact match', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'notEqual', filter: 'Italian Game' } },
        },
        {},
      );
      expect(result.lastRow).toBe(9);
      expect(result.rows.every((r: any) => r.name !== 'Italian Game')).toBe(true);
    });

    it('startsWith: matches categories starting with text', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'startsWith', filter: 'Ruy' } },
        },
        {},
      );
      expect(result.lastRow).toBe(1);
      expect(result.rows[0].name).toBe('Ruy Lopez');
    });

    it('endsWith: matches categories ending with text', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'endsWith', filter: 'Game' } },
        },
        {},
      );
      expect(result.lastRow).toBe(1);
      expect(result.rows[0].name).toBe('Italian Game');
    });

    it('should handle null filter value gracefully', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'contains', filter: null } },
        },
        {},
      );
      // null filter converted to empty string, all match ''
      expect(result.lastRow).toBe(10);
    });

    it('should handle null field value gracefully', async () => {
      // Add a category with null name
      const flatWithNull = [
        ...flatCategories,
        makeFlatCat('null-001', null as any, 0, ''),
      ];
      treeService.flattenNestedStructure.mockReturnValue(flatWithNull);

      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'contains', filter: 'Defense' } },
        },
        {},
      );
      // null should not cause crash
      expect(result.rows.every((r: any) => String(r.name || '').toLowerCase().includes('defense'))).toBe(true);
    });
  });

  // ─── Number filters (tested via grid) ─────────────────

  describe('number filters', () => {
    it('equals: matches exact number', async () => {
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'equals', filter: 0 } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.depth === 0)).toBe(true);
    });

    it('notEqual: excludes exact number', async () => {
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'notEqual', filter: 0 } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.depth !== 0)).toBe(true);
    });

    it('greaterThan: matches numbers greater than value', async () => {
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'greaterThan', filter: 0 } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.depth > 0)).toBe(true);
      expect(result.lastRow).toBe(5); // 5 child variations
    });

    it('greaterThanOrEqual: matches numbers >= value', async () => {
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'greaterThanOrEqual', filter: 1 } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.depth >= 1)).toBe(true);
    });

    it('lessThan: matches numbers less than value', async () => {
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'lessThan', filter: 1 } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.depth < 1)).toBe(true);
      expect(result.lastRow).toBe(5); // 5 root categories
    });

    it('lessThanOrEqual: matches numbers <= value', async () => {
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'lessThanOrEqual', filter: 0 } },
        },
        {},
      );
      expect(result.rows.every((r: any) => r.depth <= 0)).toBe(true);
    });

    it('inRange: matches numbers within range', async () => {
      // All depths are 0 or 1, so range 0-1 should include all
      const result = await service.grid(
        {
          filterModel: { depth: { filterType: 'number', type: 'inRange', filter: 0, filterTo: 1 } },
        },
        {},
      );
      expect(result.lastRow).toBe(10);
    });
  });

  // ─── Set filters (tested via grid) ────────────────────

  describe('set filters', () => {
    it('should filter by set of allowed values', async () => {
      const result = await service.grid(
        {
          filterModel: {
            eco: { filterType: 'set', values: ['B20', 'C00'] },
          },
        },
        {},
      );
      expect(result.lastRow).toBe(2);
      expect(result.rows.every((r: any) => ['B20', 'C00'].includes(r.eco))).toBe(true);
    });

    it('should return all when values array is empty', async () => {
      const result = await service.grid(
        {
          filterModel: {
            eco: { filterType: 'set', values: [] },
          },
        },
        {},
      );
      expect(result.lastRow).toBe(10);
    });

    it('should return nothing when no values match', async () => {
      const result = await service.grid(
        {
          filterModel: {
            eco: { filterType: 'set', values: ['Z99'] },
          },
        },
        {},
      );
      expect(result.lastRow).toBe(0);
      expect(result.rows).toEqual([]);
    });
  });

  // ─── Combined filters and sort ────────────────────────

  describe('combined filters and sort', () => {
    it('should filter and then sort', async () => {
      const result = await service.grid(
        {
          filterModel: { name: { filterType: 'text', type: 'contains', filter: 'Variation' } },
          sortModel: [{ colId: 'name', sort: 'asc' }],
        },
        {},
      );

      expect(result.lastRow).toBe(3);
      const names = result.rows.map((r: any) => r.name);
      expect(names).toEqual([...names].sort());
    });

    it('should handle empty filter model gracefully', async () => {
      const result = await service.grid(
        { filterModel: {} },
        {},
      );
      expect(result.lastRow).toBe(10);
    });

    it('should handle null filter model gracefully', async () => {
      const result = await service.grid(
        { filterModel: null },
        {},
      );
      expect(result.lastRow).toBe(10);
    });
  });
});
