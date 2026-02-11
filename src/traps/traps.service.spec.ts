import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
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
  refutationMoves: [
    { move: 'Nxe5', fen: 'r1bqkb1r/pppp1ppp/5n2/4n3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5' },
  ],
  benefitsColor: 'white',
  categoryId: 'cat-openings-002',
  eco: 'C50',
  openingName: 'Italian Game',
  variationName: "Legal's Mate Variation",
  explanation: 'White sacrifices the queen to deliver checkmate with minor pieces.',
  keyIdea: 'The bishop on c4 and knight on e5 combine for a mating net.',
  difficulty: 'intermediate',
  trapType: 'mating',
  frequency: 'occasional',
  tags: ['sacrifice', 'checkmate', 'knight'],
  isActive: true,
};

const englundGambitTrap: Partial<ITrap> = {
  _id: '6650a1b1c1d1e1f1a1b1c1d3',
  name: 'Englund Gambit Trap',
  description: 'A queen trap arising from the Englund Gambit after 1.d4 e5.',
  setupFen: 'rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1',
  triggerMove: 'Qg5',
  triggerFen: 'rnb1kbnr/pppp1ppp/8/4p1q1/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 3',
  refutationMoves: [],
  benefitsColor: 'black',
  eco: 'A40',
  openingName: 'Englund Gambit',
  explanation: 'Black lures the white queen to an awkward square where it can be trapped.',
  keyIdea: 'Queen trap after careless queen moves by White.',
  difficulty: 'beginner',
  trapType: 'material',
  frequency: 'rare',
  tags: ['gambit', 'queen-trap'],
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
  commonMistake: 'White captures the knight without seeing the pin.',
  difficulty: 'intermediate',
  trapType: 'tactical',
  frequency: 'common',
  tags: ['pin', 'discovered-attack'],
  isActive: true,
};

const laskerTrap: Partial<ITrap> = {
  _id: '6650a1b1c1d1e1f1a1b1c1d5',
  name: 'Lasker Trap',
  description: 'A trap in the Albin Counter-Gambit where Black wins the queen.',
  setupFen: 'rnbqkbnr/ppp2ppp/8/3pp3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq d6 0 3',
  triggerMove: 'e4',
  triggerFen: 'rnbqkbnr/ppp2ppp/8/3p4/2PpP3/8/PP3PPP/RNBQKBNR b KQkq e3 0 3',
  refutationMoves: [],
  benefitsColor: 'black',
  eco: 'D08',
  openingName: 'Albin Counter-Gambit',
  explanation: 'Black advances the d-pawn to d3, disrupting White development and winning material.',
  keyIdea: 'The d3 pawn forks the c2 pawn and e2 square, trapping the queen.',
  difficulty: 'advanced',
  trapType: 'tactical',
  frequency: 'rare',
  tags: ['gambit', 'queen-trap', 'advanced'],
  isActive: false,
};

const allTraps = [scholarsMate, legalTrap, englundGambitTrap, elephantTrap, laskerTrap];

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockModel() {
  // Chainable query object used by find()
  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  };

  const model: any = jest.fn(); // constructor-style usage not needed but avoids TS complaints

  model.find = jest.fn().mockReturnValue(mockQuery);
  model.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  model.findOne = jest.fn().mockResolvedValue(null);
  model.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  model.findByIdAndDelete = jest.fn().mockResolvedValue(null);
  model.countDocuments = jest.fn().mockResolvedValue(0);
  model.create = jest.fn().mockResolvedValue({ toObject: () => ({}) });
  model.aggregate = jest.fn().mockResolvedValue([]);

  // Convenience reference to the chainable query so tests can override lean()
  model.__query = mockQuery;

  return model;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('TrapsService', () => {
  let service: TrapsService;
  let model: ReturnType<typeof createMockModel>;

  beforeEach(async () => {
    model = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrapsService,
        { provide: getModelToken('Trap'), useValue: model },
      ],
    }).compile();

    service = module.get<TrapsService>(TrapsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getAll()
  // -----------------------------------------------------------------------
  describe('getAll()', () => {
    it('should return paginated results with defaults (isActive=true, page=1, limit=50)', async () => {
      model.__query.lean.mockResolvedValueOnce([scholarsMate]);
      model.countDocuments.mockResolvedValueOnce(1);

      const result = await service.getAll();

      expect(result).toEqual({ success: true, data: [scholarsMate], total: 1 });
      expect(model.find).toHaveBeenCalledWith({ isActive: true });
      expect(model.__query.sort).toHaveBeenCalledWith('-createdAt');
      expect(model.__query.skip).toHaveBeenCalledWith(0);
      expect(model.__query.limit).toHaveBeenCalledWith(50);
    });

    it('should filter by isActive=false when query.isActive is "false"', async () => {
      model.__query.lean.mockResolvedValueOnce([laskerTrap]);
      model.countDocuments.mockResolvedValueOnce(1);

      await service.getAll({ isActive: 'false' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('should filter by isActive=false when query.isActive is boolean false', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ isActive: false });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('should apply eco filter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ eco: 'C50' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ eco: 'C50', isActive: true }));
    });

    it('should apply categoryId filter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ categoryId: 'cat-openings-001' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-openings-001' }));
    });

    it('should apply difficulty filter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ difficulty: 'advanced' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'advanced' }));
    });

    it('should apply trapType filter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ trapType: 'tactical' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ trapType: 'tactical' }));
    });

    it('should apply frequency filter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ frequency: 'rare' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ frequency: 'rare' }));
    });

    it('should apply benefitsColor filter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ benefitsColor: 'white' });

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ benefitsColor: 'white' }));
    });

    it('should apply multiple filters simultaneously', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ eco: 'C50', difficulty: 'intermediate', benefitsColor: 'white' });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          eco: 'C50',
          difficulty: 'intermediate',
          benefitsColor: 'white',
        }),
      );
    });

    it('should handle custom pagination (page 2, limit 10)', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(25);

      await service.getAll({ page: '2', limit: '10' });

      expect(model.__query.skip).toHaveBeenCalledWith(10);
      expect(model.__query.limit).toHaveBeenCalledWith(10);
    });

    it('should handle custom sort parameter', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ sort: 'name' });

      expect(model.__query.sort).toHaveBeenCalledWith('name');
    });

    it('should default page to 1 and limit to 50 when invalid values are given', async () => {
      model.__query.lean.mockResolvedValueOnce([]);
      model.countDocuments.mockResolvedValueOnce(0);

      await service.getAll({ page: 'abc', limit: 'xyz' });

      expect(model.__query.skip).toHaveBeenCalledWith(0); // (1-1)*50
      expect(model.__query.limit).toHaveBeenCalledWith(50);
    });

    it('should propagate errors from the database', async () => {
      model.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('DB connection lost')),
      });
      model.countDocuments.mockResolvedValue(0);

      await expect(service.getAll()).rejects.toThrow('DB connection lost');
    });
  });

  // -----------------------------------------------------------------------
  // getById()
  // -----------------------------------------------------------------------
  describe('getById()', () => {
    it('should return the trap when found', async () => {
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(scholarsMate) });

      const result = await service.getById('6650a1b1c1d1e1f1a1b1c1d1');

      expect(result).toEqual(scholarsMate);
      expect(model.findById).toHaveBeenCalledWith('6650a1b1c1d1e1f1a1b1c1d1');
    });

    it('should throw NotFoundException when trap is not found', async () => {
      model.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(service.getById('nonexistent-id')).rejects.toThrow(NotFoundException);
      await expect(service.getById('nonexistent-id')).rejects.toThrow('Trap with ID nonexistent-id not found');
    });
  });

  // -----------------------------------------------------------------------
  // findByFen()
  // -----------------------------------------------------------------------
  describe('findByFen()', () => {
    it('should find traps by exact FEN match (default matchType)', async () => {
      const fen = scholarsMate.setupFen!;
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([scholarsMate]) });

      const result = await service.findByFen(fen);

      expect(result).toEqual({ success: true, data: [scholarsMate] });
      expect(model.find).toHaveBeenCalledWith({
        $or: [{ setupFen: fen }, { triggerFen: fen }],
      });
    });

    it('should find traps using prefix match when matchType is "prefix"', async () => {
      const fullFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const fenPrefix = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR';
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([scholarsMate]) });

      const result = await service.findByFen(fullFen, 'prefix');

      expect(result).toEqual({ success: true, data: [scholarsMate] });
      expect(model.find).toHaveBeenCalledWith({
        $or: [
          { setupFen: { $regex: `^${fenPrefix}` } },
          { triggerFen: { $regex: `^${fenPrefix}` } },
        ],
      });
    });

    it('should throw BadRequestException when fen is empty', async () => {
      await expect(service.findByFen('')).rejects.toThrow(BadRequestException);
      await expect(service.findByFen('')).rejects.toThrow('FEN position is required');
    });

    it('should return empty array when no traps match the FEN', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.findByFen('8/8/8/8/8/8/8/8 w - - 0 1');

      expect(result).toEqual({ success: true, data: [] });
    });
  });

  // -----------------------------------------------------------------------
  // findByEco()
  // -----------------------------------------------------------------------
  describe('findByEco()', () => {
    it('should find traps with case-insensitive prefix ECO match', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([scholarsMate]) });

      const result = await service.findByEco('c20');

      expect(result).toEqual({ success: true, data: [scholarsMate] });
      expect(model.find).toHaveBeenCalledWith({
        eco: { $regex: '^c20', $options: 'i' },
        isActive: true,
      });
    });

    it('should throw BadRequestException when eco is empty', async () => {
      await expect(service.findByEco('')).rejects.toThrow(BadRequestException);
      await expect(service.findByEco('')).rejects.toThrow('ECO code is required');
    });

    it('should return empty array when no traps match the ECO code', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.findByEco('Z99');

      expect(result).toEqual({ success: true, data: [] });
    });
  });

  // -----------------------------------------------------------------------
  // findByCategoryId()
  // -----------------------------------------------------------------------
  describe('findByCategoryId()', () => {
    it('should find active traps by categoryId', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([scholarsMate]) });

      const result = await service.findByCategoryId('cat-openings-001');

      expect(result).toEqual({ success: true, data: [scholarsMate] });
      expect(model.find).toHaveBeenCalledWith({ categoryId: 'cat-openings-001', isActive: true });
    });

    it('should throw BadRequestException when categoryId is empty', async () => {
      await expect(service.findByCategoryId('')).rejects.toThrow(BadRequestException);
      await expect(service.findByCategoryId('')).rejects.toThrow('Category ID is required');
    });

    it('should return empty array when no traps found for the category', async () => {
      model.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      const result = await service.findByCategoryId('nonexistent-category');

      expect(result).toEqual({ success: true, data: [] });
    });
  });

  // -----------------------------------------------------------------------
  // create()
  // -----------------------------------------------------------------------
  describe('create()', () => {
    const validTrapData: Partial<ITrap> = {
      name: 'Fishing Pole Trap',
      description: 'A trap in the Ruy Lopez Berlin where Black sacrifices a knight.',
      setupFen: 'r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      triggerMove: 'Ng4',
      triggerFen: 'r1bqkb1r/pppp1ppp/2n5/1B2p3/4P1n1/5N2/PPPP1PPP/RNBQK2R w KQkq - 5 5',
      explanation: 'Black threatens Qf6, Ng4-f2 fork.',
      keyIdea: 'Knight sacrifice to open lines against the white king.',
      benefitsColor: 'black',
    };

    it('should create a trap with all required fields', async () => {
      const created = { ...validTrapData, _id: 'new-id-123', toObject: () => ({ ...validTrapData, _id: 'new-id-123' }) };
      model.create.mockResolvedValue(created);

      const result = await service.create(validTrapData);

      expect(result).toEqual({ ...validTrapData, _id: 'new-id-123' });
      expect(model.create).toHaveBeenCalledWith(validTrapData);
    });

    it('should throw BadRequestException when name is missing', async () => {
      const { name, ...missingName } = validTrapData;

      await expect(service.create(missingName)).rejects.toThrow(BadRequestException);
      await expect(service.create(missingName)).rejects.toThrow('Missing required fields: name');
    });

    it('should throw BadRequestException when description is missing', async () => {
      const { description, ...missingDesc } = validTrapData;

      await expect(service.create(missingDesc)).rejects.toThrow(BadRequestException);
      await expect(service.create(missingDesc)).rejects.toThrow(/description/);
    });

    it('should throw BadRequestException when multiple required fields are missing', async () => {
      const incomplete: Partial<ITrap> = { name: 'Incomplete Trap' };

      await expect(service.create(incomplete)).rejects.toThrow(BadRequestException);
      await expect(service.create(incomplete)).rejects.toThrow(/Missing required fields/);
    });

    it('should list all missing required fields in error message', async () => {
      try {
        await service.create({});
        fail('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const message = (error as BadRequestException).message;
        expect(message).toContain('name');
        expect(message).toContain('description');
        expect(message).toContain('setupFen');
        expect(message).toContain('triggerMove');
        expect(message).toContain('triggerFen');
        expect(message).toContain('explanation');
        expect(message).toContain('keyIdea');
        expect(message).toContain('benefitsColor');
      }
    });

    it('should throw ConflictException on duplicate key error (code 11000)', async () => {
      const duplicateError: any = new Error('E11000 duplicate key');
      duplicateError.code = 11000;
      model.create.mockRejectedValue(duplicateError);

      await expect(service.create(validTrapData)).rejects.toThrow(ConflictException);
      await expect(service.create(validTrapData)).rejects.toThrow('A trap with this data already exists');
    });

    it('should rethrow non-duplicate database errors', async () => {
      model.create.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.create(validTrapData)).rejects.toThrow('Connection timeout');
    });
  });

  // -----------------------------------------------------------------------
  // update()
  // -----------------------------------------------------------------------
  describe('update()', () => {
    const trapId = '6650a1b1c1d1e1f1a1b1c1d1';

    it('should update and return the trap', async () => {
      const updatedTrap = { ...scholarsMate, name: 'Updated Trap Name' };
      model.findByIdAndUpdate.mockResolvedValue(updatedTrap);

      const result = await service.update(trapId, { name: 'Updated Trap Name' });

      expect(result).toEqual(updatedTrap);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        trapId,
        expect.objectContaining({ name: 'Updated Trap Name', updatedAt: expect.any(Date) }),
        { new: true, lean: true },
      );
    });

    it('should strip _id from update data to prevent overwrites', async () => {
      model.findByIdAndUpdate.mockResolvedValue(scholarsMate);

      await service.update(trapId, { _id: 'attempt-to-change-id', name: 'Safe Update' } as any);

      const updatePayload = model.findByIdAndUpdate.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('_id');
      expect(updatePayload.name).toBe('Safe Update');
    });

    it('should include updatedAt timestamp in the update', async () => {
      model.findByIdAndUpdate.mockResolvedValue(scholarsMate);
      const before = new Date();

      await service.update(trapId, { difficulty: 'advanced' });

      const updatePayload = model.findByIdAndUpdate.mock.calls[0][1];
      expect(updatePayload.updatedAt).toBeInstanceOf(Date);
      expect(updatePayload.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should throw NotFoundException when trap does not exist', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'No Trap' })).rejects.toThrow(NotFoundException);
      await expect(service.update('nonexistent', { name: 'No Trap' })).rejects.toThrow(
        'Trap with ID nonexistent not found',
      );
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------
  describe('delete()', () => {
    const trapId = '6650a1b1c1d1e1f1a1b1c1d1';

    it('should soft delete (set isActive=false) by default', async () => {
      model.findByIdAndUpdate.mockResolvedValue({ ...scholarsMate, isActive: false });

      const result = await service.delete(trapId);

      expect(result).toEqual({ success: true, message: `Trap ${trapId} soft deleted` });
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(trapId, { isActive: false }, { new: true });
    });

    it('should permanently delete when permanent=true', async () => {
      model.findByIdAndDelete.mockResolvedValue(scholarsMate);

      const result = await service.delete(trapId, true);

      expect(result).toEqual({ success: true, message: `Trap ${trapId} permanently deleted` });
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(trapId);
    });

    it('should throw NotFoundException on soft delete when trap not found', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException on permanent delete when trap not found', async () => {
      model.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.delete('nonexistent', true)).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // bulkImport()
  // -----------------------------------------------------------------------
  describe('bulkImport()', () => {
    it('should create new traps that do not already exist', async () => {
      model.findOne.mockResolvedValue(null); // no existing trap
      model.create.mockResolvedValue(scholarsMate);

      const result = await service.bulkImport({ traps: [scholarsMate] });

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(model.create).toHaveBeenCalledWith(scholarsMate);
    });

    it('should update existing traps when they match by name and setupFen', async () => {
      model.findOne.mockResolvedValue({ ...scholarsMate, _id: 'existing-id' });
      model.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.bulkImport({ traps: [scholarsMate] });

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('existing-id', scholarsMate);
    });

    it('should skip updating when trap has update=false', async () => {
      model.findOne.mockResolvedValue({ ...scholarsMate, _id: 'existing-id' });

      const trapWithNoUpdate = { ...scholarsMate, update: false };
      const result = await service.bulkImport({ traps: [trapWithNoUpdate] });

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should accept body as a plain array (not wrapped in { traps: [] })', async () => {
      model.findOne.mockResolvedValue(null);
      model.create.mockResolvedValue(scholarsMate);

      const result = await service.bulkImport([scholarsMate, legalTrap]);

      expect(result.created).toBe(2);
    });

    it('should throw BadRequestException for empty array', async () => {
      await expect(service.bulkImport({ traps: [] })).rejects.toThrow(BadRequestException);
      await expect(service.bulkImport({ traps: [] })).rejects.toThrow(
        'Request body must contain an array of traps',
      );
    });

    it('should throw BadRequestException for non-array body', async () => {
      await expect(service.bulkImport({ traps: 'not-an-array' })).rejects.toThrow(BadRequestException);
    });

    it('should collect errors for individual traps without stopping the import', async () => {
      model.findOne.mockResolvedValue(null);
      model.create
        .mockResolvedValueOnce(scholarsMate) // first succeeds
        .mockRejectedValueOnce(new Error('Validation failed')) // second fails
        .mockResolvedValueOnce(englundGambitTrap); // third succeeds

      const result = await service.bulkImport([scholarsMate, legalTrap, englundGambitTrap]);

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        name: legalTrap.name,
        error: 'Validation failed',
      });
    });

    it('should report correct message with counts', async () => {
      model.findOne
        .mockResolvedValueOnce(null) // create
        .mockResolvedValueOnce({ _id: 'existing-id' }); // update
      model.create.mockResolvedValue(scholarsMate);
      model.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.bulkImport([scholarsMate, legalTrap]);

      expect(result.message).toBe('Import complete: 1 created, 1 updated, 0 errors');
    });
  });

  // -----------------------------------------------------------------------
  // search()
  // -----------------------------------------------------------------------
  describe('search()', () => {
    it('should search across name, description, openingName, keyIdea, eco', async () => {
      model.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([scholarsMate]),
        }),
      });

      const result = await service.search('Scholar');

      expect(result).toEqual({ success: true, data: [scholarsMate] });
      const filterArg = model.find.mock.calls[0][0];
      expect(filterArg.$or).toHaveLength(5);
      expect(filterArg.isActive).toBe(true);
    });

    it('should apply custom limit', async () => {
      const mockLimit = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      model.find.mockReturnValue({ limit: mockLimit });

      await service.search('test', 5);

      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('should use default limit of 20 when not specified', async () => {
      const mockLimit = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      model.find.mockReturnValue({ limit: mockLimit });

      await service.search('Legal');

      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('should throw BadRequestException when query is less than 2 characters', async () => {
      await expect(service.search('a')).rejects.toThrow(BadRequestException);
      await expect(service.search('a')).rejects.toThrow('Search query must be at least 2 characters');
    });

    it('should throw BadRequestException when query is empty', async () => {
      await expect(service.search('')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when query is only whitespace', async () => {
      await expect(service.search('   ')).rejects.toThrow(BadRequestException);
    });

    it('should trim whitespace from query before building regex', async () => {
      model.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });

      await service.search('  Italian  ');

      const filterArg = model.find.mock.calls[0][0];
      // The regex source should be trimmed
      expect(filterArg.$or[0].name).toEqual(expect.any(RegExp));
      expect(filterArg.$or[0].name.source).toBe('Italian');
    });
  });

  // -----------------------------------------------------------------------
  // getStats()
  // -----------------------------------------------------------------------
  describe('getStats()', () => {
    it('should return aggregated statistics', async () => {
      const byDifficulty = [
        { _id: 'beginner', count: 5 },
        { _id: 'intermediate', count: 10 },
        { _id: 'advanced', count: 3 },
      ];
      const byTrapType = [
        { _id: 'tactical', count: 8 },
        { _id: 'mating', count: 6 },
        { _id: 'material', count: 3 },
        { _id: 'positional', count: 1 },
      ];
      const byEco = [
        { _id: 'C50', count: 5 },
        { _id: 'C20', count: 3 },
      ];

      model.countDocuments
        .mockResolvedValueOnce(18)  // total
        .mockResolvedValueOnce(15); // active
      model.aggregate
        .mockResolvedValueOnce(byDifficulty)
        .mockResolvedValueOnce(byTrapType)
        .mockResolvedValueOnce(byEco);

      const result = await service.getStats();

      expect(result).toEqual({
        success: true,
        stats: {
          total: 18,
          active: 15,
          byDifficulty,
          byTrapType,
          topEcoCodes: byEco,
        },
      });
    });

    it('should call countDocuments twice (total and active)', async () => {
      model.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getStats();

      expect(model.countDocuments).toHaveBeenCalledTimes(2);
      expect(model.countDocuments).toHaveBeenNthCalledWith(1);
      expect(model.countDocuments).toHaveBeenNthCalledWith(2, { isActive: true });
    });

    it('should call aggregate three times (byDifficulty, byTrapType, byEco)', async () => {
      model.countDocuments.mockResolvedValue(0);

      await service.getStats();

      expect(model.aggregate).toHaveBeenCalledTimes(3);
    });

    it('should propagate errors from aggregation', async () => {
      model.countDocuments.mockRejectedValue(new Error('Aggregation failed'));

      await expect(service.getStats()).rejects.toThrow('Aggregation failed');
    });
  });
});
