import { Test, TestingModule } from '@nestjs/testing';
import { TrapsController } from './traps.controller';
import { TrapsService } from './traps.service';
import { ITrap } from './schemas/trap.schema';

// ---------------------------------------------------------------------------
// Realistic chess trap fixtures
// ---------------------------------------------------------------------------

const scholarsMate: Partial<ITrap> = {
  _id: '6650a1b1c1d1e1f1a1b1c1d1',
  name: "Scholar's Mate Trap",
  description: 'A quick checkmate trap targeting f7 with the queen and bishop.',
  setupFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  triggerMove: 'Qh5',
  triggerFen: 'rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2',
  refutationMoves: [
    { move: 'g6', fen: 'rnbqkbnr/pppp1p1p/6p1/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3' },
  ],
  benefitsColor: 'white',
  categoryId: 'cat-openings-001',
  eco: 'C20',
  openingName: "King's Pawn Opening",
  explanation: 'White aims for Qxf7# if Black is careless.',
  keyIdea: 'Attack the weak f7 pawn before it is defended.',
  difficulty: 'beginner',
  trapType: 'mating',
  frequency: 'common',
  tags: ['beginner', 'checkmate', 'queen'],
  isActive: true,
};

const legalTrap: Partial<ITrap> = {
  _id: '6650a1b1c1d1e1f1a1b1c1d2',
  name: "Legal's Trap",
  description: 'A classic trap where a knight sacrifice leads to checkmate.',
  setupFen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
  triggerMove: 'Nxe5',
  triggerFen: 'r1bqkb1r/pppp1ppp/2n2n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 4',
  refutationMoves: [],
  benefitsColor: 'white',
  categoryId: 'cat-openings-002',
  eco: 'C50',
  openingName: 'Italian Game',
  explanation: 'White sacrifices the queen to deliver checkmate with minor pieces.',
  keyIdea: 'The bishop on c4 and knight on e5 combine for a mating net.',
  difficulty: 'intermediate',
  trapType: 'mating',
  frequency: 'occasional',
  tags: ['sacrifice', 'checkmate', 'knight'],
  isActive: true,
};

const elephantTrap: Partial<ITrap> = {
  _id: '6650a1b1c1d1e1f1a1b1c1d4',
  name: 'Elephant Trap',
  description: 'A well-known trap in the Queen\'s Gambit Declined that wins a piece.',
  setupFen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 3 4',
  triggerMove: 'Nxd5',
  triggerFen: 'rnbqkb1r/ppp2ppp/4p3/3n4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5',
  refutationMoves: [],
  benefitsColor: 'black',
  categoryId: 'cat-openings-003',
  eco: 'D31',
  openingName: "Queen's Gambit Declined",
  explanation: 'Black sets up a discovered attack to win the exchange or a piece.',
  keyIdea: 'After Nxc3 bxc3, the bishop on b4 pins and wins material.',
  difficulty: 'intermediate',
  trapType: 'tactical',
  frequency: 'common',
  tags: ['pin', 'discovered-attack'],
  isActive: true,
};

// ---------------------------------------------------------------------------
// Mock service factory
// ---------------------------------------------------------------------------

function createMockTrapsService() {
  return {
    getAll: jest.fn(),
    getById: jest.fn(),
    findByFen: jest.fn(),
    findByEco: jest.fn(),
    findByCategoryId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulkImport: jest.fn(),
    search: jest.fn(),
    getStats: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('TrapsController', () => {
  let controller: TrapsController;
  let service: ReturnType<typeof createMockTrapsService>;

  beforeEach(async () => {
    service = createMockTrapsService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrapsController],
      providers: [
        { provide: TrapsService, useValue: service },
      ],
    }).compile();

    controller = module.get<TrapsController>(TrapsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getAll()
  // -----------------------------------------------------------------------
  describe('getAll()', () => {
    it('should delegate to TrapsService.getAll with the query', async () => {
      const expectedResult = { success: true, data: [scholarsMate, legalTrap], total: 2 };
      service.getAll.mockResolvedValue(expectedResult);
      const query = { eco: 'C20', difficulty: 'beginner' };

      const result = await controller.getAll(query);

      expect(result).toEqual(expectedResult);
      expect(service.getAll).toHaveBeenCalledWith(query);
      expect(service.getAll).toHaveBeenCalledTimes(1);
    });

    it('should pass empty query when no filters provided', async () => {
      const expectedResult = { success: true, data: [], total: 0 };
      service.getAll.mockResolvedValue(expectedResult);

      const result = await controller.getAll({});

      expect(result).toEqual(expectedResult);
      expect(service.getAll).toHaveBeenCalledWith({});
    });

    it('should propagate errors from the service', async () => {
      service.getAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.getAll({})).rejects.toThrow('Database error');
    });
  });

  // -----------------------------------------------------------------------
  // getStats()
  // -----------------------------------------------------------------------
  describe('getStats()', () => {
    it('should delegate to TrapsService.getStats', async () => {
      const statsResult = {
        success: true,
        stats: {
          total: 18,
          active: 15,
          byDifficulty: [{ _id: 'beginner', count: 5 }],
          byTrapType: [{ _id: 'tactical', count: 8 }],
          topEcoCodes: [{ _id: 'C50', count: 5 }],
        },
      };
      service.getStats.mockResolvedValue(statsResult);

      const result = await controller.getStats();

      expect(result).toEqual(statsResult);
      expect(service.getStats).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // search()
  // -----------------------------------------------------------------------
  describe('search()', () => {
    it('should delegate to TrapsService.search with query and limit', async () => {
      const searchResult = { success: true, data: [scholarsMate] };
      service.search.mockResolvedValue(searchResult);

      const result = await controller.search('Scholar', 10);

      expect(result).toEqual(searchResult);
      expect(service.search).toHaveBeenCalledWith('Scholar', 10);
    });

    it('should pass undefined limit when not provided', async () => {
      service.search.mockResolvedValue({ success: true, data: [] });

      await controller.search('Elephant');

      expect(service.search).toHaveBeenCalledWith('Elephant', undefined);
    });
  });

  // -----------------------------------------------------------------------
  // findByFen()
  // -----------------------------------------------------------------------
  describe('findByFen()', () => {
    it('should delegate to TrapsService.findByFen with fen and matchType', async () => {
      const fenResult = { success: true, data: [scholarsMate] };
      service.findByFen.mockResolvedValue(fenResult);
      const fen = scholarsMate.setupFen!;

      const result = await controller.findByFen(fen, 'prefix');

      expect(result).toEqual(fenResult);
      expect(service.findByFen).toHaveBeenCalledWith(fen, 'prefix');
    });

    it('should pass undefined matchType when not provided', async () => {
      service.findByFen.mockResolvedValue({ success: true, data: [] });
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      await controller.findByFen(fen);

      expect(service.findByFen).toHaveBeenCalledWith(fen, undefined);
    });
  });

  // -----------------------------------------------------------------------
  // findByEco()
  // -----------------------------------------------------------------------
  describe('findByEco()', () => {
    it('should delegate to TrapsService.findByEco with eco param', async () => {
      const ecoResult = { success: true, data: [legalTrap] };
      service.findByEco.mockResolvedValue(ecoResult);

      const result = await controller.findByEco('C50');

      expect(result).toEqual(ecoResult);
      expect(service.findByEco).toHaveBeenCalledWith('C50');
      expect(service.findByEco).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // findByCategoryId()
  // -----------------------------------------------------------------------
  describe('findByCategoryId()', () => {
    it('should delegate to TrapsService.findByCategoryId with categoryId param', async () => {
      const catResult = { success: true, data: [elephantTrap] };
      service.findByCategoryId.mockResolvedValue(catResult);

      const result = await controller.findByCategoryId('cat-openings-003');

      expect(result).toEqual(catResult);
      expect(service.findByCategoryId).toHaveBeenCalledWith('cat-openings-003');
      expect(service.findByCategoryId).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // getById()
  // -----------------------------------------------------------------------
  describe('getById()', () => {
    it('should delegate to TrapsService.getById with id param', async () => {
      service.getById.mockResolvedValue(scholarsMate);

      const result = await controller.getById('6650a1b1c1d1e1f1a1b1c1d1');

      expect(result).toEqual(scholarsMate);
      expect(service.getById).toHaveBeenCalledWith('6650a1b1c1d1e1f1a1b1c1d1');
    });

    it('should propagate NotFoundException from the service', async () => {
      service.getById.mockRejectedValue(new Error('Trap with ID unknown not found'));

      await expect(controller.getById('unknown')).rejects.toThrow('Trap with ID unknown not found');
    });
  });

  // -----------------------------------------------------------------------
  // create()
  // -----------------------------------------------------------------------
  describe('create()', () => {
    it('should delegate to TrapsService.create with the body', async () => {
      const newTrapData: Partial<ITrap> = {
        name: 'Fishing Pole Trap',
        description: 'A trap in the Berlin Defense.',
        setupFen: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        triggerMove: 'Ng4',
        triggerFen: 'r1bqkb1r/pppp1ppp/2n5/1B2p3/4P1n1/5N2/PPPP1PPP/RNBQK2R w KQkq - 5 5',
        explanation: 'Black threatens Qf6 and Nf2 fork.',
        keyIdea: 'Knight sacrifice to open lines.',
        benefitsColor: 'black',
      };
      const createdTrap = { ...newTrapData, _id: 'new-id' };
      service.create.mockResolvedValue(createdTrap);

      const result = await controller.create(newTrapData);

      expect(result).toEqual(createdTrap);
      expect(service.create).toHaveBeenCalledWith(newTrapData);
    });

    it('should propagate validation errors from the service', async () => {
      service.create.mockRejectedValue(new Error('Missing required fields: name'));

      await expect(controller.create({})).rejects.toThrow('Missing required fields: name');
    });
  });

  // -----------------------------------------------------------------------
  // bulkImport()
  // -----------------------------------------------------------------------
  describe('bulkImport()', () => {
    it('should delegate to TrapsService.bulkImport with the body', async () => {
      const importBody = { traps: [scholarsMate, legalTrap] };
      const importResult = {
        success: true,
        message: 'Import complete: 2 created, 0 updated, 0 errors',
        created: 2,
        updated: 0,
        errors: [],
      };
      service.bulkImport.mockResolvedValue(importResult);

      const result = await controller.bulkImport(importBody);

      expect(result).toEqual(importResult);
      expect(service.bulkImport).toHaveBeenCalledWith(importBody);
    });

    it('should propagate errors for invalid body', async () => {
      service.bulkImport.mockRejectedValue(new Error('Request body must contain an array of traps'));

      await expect(controller.bulkImport({})).rejects.toThrow('Request body must contain an array of traps');
    });
  });

  // -----------------------------------------------------------------------
  // update()
  // -----------------------------------------------------------------------
  describe('update()', () => {
    it('should delegate to TrapsService.update with id and body', async () => {
      const updateData = { name: 'Updated Name', difficulty: 'advanced' as const };
      const updatedTrap = { ...scholarsMate, ...updateData };
      service.update.mockResolvedValue(updatedTrap);

      const result = await controller.update('6650a1b1c1d1e1f1a1b1c1d1', updateData);

      expect(result).toEqual(updatedTrap);
      expect(service.update).toHaveBeenCalledWith('6650a1b1c1d1e1f1a1b1c1d1', updateData);
    });

    it('should propagate NotFoundException from the service', async () => {
      service.update.mockRejectedValue(new Error('Trap with ID bad-id not found'));

      await expect(controller.update('bad-id', { name: 'X' })).rejects.toThrow('Trap with ID bad-id not found');
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------
  describe('delete()', () => {
    it('should delegate soft delete when permanent query is absent', async () => {
      const deleteResult = { success: true, message: 'Trap abc soft deleted' };
      service.delete.mockResolvedValue(deleteResult);

      const result = await controller.delete('abc');

      expect(result).toEqual(deleteResult);
      expect(service.delete).toHaveBeenCalledWith('abc', false);
    });

    it('should delegate permanent delete when permanent query is "true"', async () => {
      const deleteResult = { success: true, message: 'Trap abc permanently deleted' };
      service.delete.mockResolvedValue(deleteResult);

      const result = await controller.delete('abc', 'true');

      expect(result).toEqual(deleteResult);
      expect(service.delete).toHaveBeenCalledWith('abc', true);
    });

    it('should delegate soft delete when permanent query is "false"', async () => {
      const deleteResult = { success: true, message: 'Trap abc soft deleted' };
      service.delete.mockResolvedValue(deleteResult);

      const result = await controller.delete('abc', 'false');

      expect(result).toEqual(deleteResult);
      expect(service.delete).toHaveBeenCalledWith('abc', false);
    });

    it('should propagate NotFoundException from the service', async () => {
      service.delete.mockRejectedValue(new Error('Trap with ID xyz not found'));

      await expect(controller.delete('xyz')).rejects.toThrow('Trap with ID xyz not found');
    });
  });
});
