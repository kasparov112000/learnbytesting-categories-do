// ---------------------------------------------------------------------------
// Mock TrapModel — must be declared before any import that uses it.
// jest.mock is hoisted, so the factory cannot reference module-scope variables.
// Instead, we build mock fns inside the factory and export them via a
// .__mocks object so tests can access and configure them.
// ---------------------------------------------------------------------------
const mockSave = jest.fn();

jest.mock('../../models/trap.model', () => {
  const mockLean = jest.fn();
  const mockLimit = jest.fn().mockReturnValue({ lean: mockLean });
  const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
  const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });

  const mockFindById = jest.fn().mockReturnValue({ lean: jest.fn() });
  const mockFindOne = jest.fn();
  const mockFindByIdAndUpdate = jest.fn();
  const mockFindByIdAndDelete = jest.fn();
  const mockCountDocuments = jest.fn();
  const mockAggregate = jest.fn();
  const mockFind = jest.fn().mockReturnValue({
    sort: mockSort,
    limit: mockLimit,
    lean: mockLean,
  });

  // Constructor: `new TrapModel(data)` returns an object with .save()
  const TrapModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    _id: 'new-trap-id',
    save: mockSave,
  }));

  TrapModel.find = mockFind;
  TrapModel.findById = mockFindById;
  TrapModel.findOne = mockFindOne;
  TrapModel.findByIdAndUpdate = mockFindByIdAndUpdate;
  TrapModel.findByIdAndDelete = mockFindByIdAndDelete;
  TrapModel.countDocuments = mockCountDocuments;
  TrapModel.aggregate = mockAggregate;

  // Expose inner mocks so tests can configure them
  TrapModel.__mocks = {
    find: mockFind,
    findById: mockFindById,
    findOne: mockFindOne,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
    countDocuments: mockCountDocuments,
    aggregate: mockAggregate,
    sort: mockSort,
    skip: mockSkip,
    limit: mockLimit,
    lean: mockLean,
  };

  return { TrapModel };
});

import { TrapService } from '../../services/trap.service';
import { TrapModel } from '../../models/trap.model';

// Pull inner mock references out so tests can configure them easily
const mocks = (TrapModel as any).__mocks as {
  find: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  countDocuments: jest.Mock;
  aggregate: jest.Mock;
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  lean: jest.Mock;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A complete, valid trap payload for create / bulk-import tests. */
const validTrapData = () => ({
  name: 'Fishing Pole Trap',
  description: 'A classic trap in the Ruy Lopez',
  setupFen: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
  triggerMove: 'Nxe5',
  triggerFen: 'rnbqkb1r/pppp1ppp/8/4N3/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 4',
  explanation: 'White falls for the trap by capturing e5 prematurely.',
  keyIdea: 'Deflection of the knight allows Qh4+',
  benefitsColor: 'black' as const,
  difficulty: 'intermediate' as const,
  trapType: 'tactical' as const,
  frequency: 'common' as const,
  refutationMoves: [
    {
      move: 'Qh4+',
      fen: 'rnbqkb1r/pppp1ppp/8/4N3/2B1P2q/8/PPPP1PPP/RNBQK2R w KQkq - 1 5',
    },
  ],
  tags: ['ruy-lopez', 'tactical'],
  isActive: true,
  eco: 'C65',
  openingName: 'Ruy Lopez, Berlin Defense',
  categoryId: 'cat-ruy-lopez',
});

/**
 * Helper: set up the full chainable mock for
 *   TrapModel.find(q).sort().skip().limit().lean()
 * and TrapModel.countDocuments() in one call.
 */
function setupGetAllChain(resolvedTraps: any[], total: number) {
  const lean = jest.fn().mockResolvedValue(resolvedTraps);
  const limit = jest.fn().mockReturnValue({ lean });
  const skip = jest.fn().mockReturnValue({ limit });
  const sort = jest.fn().mockReturnValue({ skip });
  mocks.find.mockReturnValue({ sort, limit, lean });
  mocks.countDocuments.mockResolvedValue(total);
  return { sort, skip, limit, lean };
}

/**
 * Helper: set up find().lean() chain (no sort/skip/limit).
 */
function setupFindLeanChain(resolvedTraps: any[]) {
  const lean = jest.fn().mockResolvedValue(resolvedTraps);
  mocks.find.mockReturnValue({ lean, sort: jest.fn(), limit: jest.fn(), skip: jest.fn() });
  return { lean };
}

/**
 * Helper: set up find().limit().lean() chain (search pattern).
 */
function setupSearchChain(resolvedTraps: any[]) {
  const lean = jest.fn().mockResolvedValue(resolvedTraps);
  const limit = jest.fn().mockReturnValue({ lean });
  mocks.find.mockReturnValue({ limit, sort: jest.fn(), lean: jest.fn() });
  return { limit, lean };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TrapService', () => {
  let service: TrapService;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new TrapService();

    mockReq = { params: {}, query: {}, body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Safe defaults (overridden per-test when needed)
    mocks.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mocks.findOne.mockResolvedValue(null);
    mocks.findByIdAndUpdate.mockResolvedValue(null);
    mocks.findByIdAndDelete.mockResolvedValue(null);
    mocks.countDocuments.mockResolvedValue(0);
    mocks.aggregate.mockResolvedValue([]);
    mockSave.mockResolvedValue(undefined);
  });

  // =========================================================================
  // getAll
  // =========================================================================
  describe('getAll', () => {
    it('should return traps with default filters (isActive=true)', async () => {
      const traps = [{ _id: '1', name: 'Trap A' }, { _id: '2', name: 'Trap B' }];
      const chain = setupGetAllChain(traps, 2);

      await service.getAll(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({ isActive: true });
      expect(chain.sort).toHaveBeenCalledWith({ name: 1 });
      expect(chain.skip).toHaveBeenCalledWith(0);
      expect(chain.limit).toHaveBeenCalledWith(100);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: traps,
        count: 2,
        total: 2,
      });
    });

    it('should apply all optional query filters', async () => {
      mockReq.query = {
        eco: 'C65',
        categoryId: 'cat-1',
        difficulty: 'advanced',
        trapType: 'mating',
        frequency: 'rare',
        benefitsColor: 'white',
        isActive: 'true',
        limit: '50',
        skip: '10',
      };
      const chain = setupGetAllChain([], 0);

      await service.getAll(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({
        isActive: true,
        eco: 'C65',
        categoryId: 'cat-1',
        difficulty: 'advanced',
        trapType: 'mating',
        frequency: 'rare',
        benefitsColor: 'white',
      });
      expect(chain.skip).toHaveBeenCalledWith(10);
      expect(chain.limit).toHaveBeenCalledWith(50);
    });

    it('should handle isActive=false as a string', async () => {
      mockReq.query = { isActive: 'false' };
      setupGetAllChain([], 0);

      await service.getAll(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({ isActive: false });
    });

    it('should return 500 on database error', async () => {
      const lean = jest.fn().mockRejectedValue(new Error('DB connection failed'));
      const limit = jest.fn().mockReturnValue({ lean });
      const skip = jest.fn().mockReturnValue({ limit });
      const sort = jest.fn().mockReturnValue({ skip });
      mocks.find.mockReturnValue({ sort });

      await service.getAll(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve traps',
          message: 'DB connection failed',
        })
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe('getById', () => {
    it('should return a trap when found', async () => {
      const trap = { _id: 'abc123', name: 'Test Trap' };
      mocks.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(trap) });
      mockReq.params.id = 'abc123';

      await service.getById(mockReq, mockRes);

      expect(mocks.findById).toHaveBeenCalledWith('abc123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, result: trap });
    });

    it('should return 404 when trap not found', async () => {
      mocks.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      mockReq.params.id = 'nonexistent';

      await service.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Trap with ID nonexistent not found',
      });
    });

    it('should return 500 on database error', async () => {
      mocks.findById.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Cast error')),
      });
      mockReq.params.id = 'bad-id';

      await service.getById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to retrieve trap' })
      );
    });
  });

  // =========================================================================
  // findByFen
  // =========================================================================
  describe('findByFen', () => {
    it('should return 400 when no FEN provided', async () => {
      mockReq.body = {};

      await service.findByFen(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'FEN position is required',
      });
    });

    it('should find traps with exact match on setupFen or triggerFen', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const traps = [{ _id: '1', name: 'Trap A' }];
      setupFindLeanChain(traps);
      mockReq.body = { fen, matchType: 'exact' };

      await service.findByFen(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({
        isActive: true,
        $or: [{ setupFen: fen }, { triggerFen: fen }],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: traps,
        count: 1,
      });
    });

    it('should default to exact match when matchType is not specified', async () => {
      const fen = 'some/fen';
      setupFindLeanChain([]);
      mockReq.body = { fen };

      await service.findByFen(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [{ setupFen: fen }, { triggerFen: fen }],
        })
      );
    });

    it('should find traps with prefix match (strips move counters)', async () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const fenPrefix = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -';
      setupFindLeanChain([]);
      mockReq.body = { fen, matchType: 'prefix' };

      await service.findByFen(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({
        isActive: true,
        $or: [
          { setupFen: { $regex: `^${fenPrefix}` } },
          { triggerFen: { $regex: `^${fenPrefix}` } },
        ],
      });
    });

    it('should return 500 on database error', async () => {
      const lean = jest.fn().mockRejectedValue(new Error('DB error'));
      mocks.find.mockReturnValue({ lean });
      mockReq.body = { fen: 'some/fen' };

      await service.findByFen(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to find traps by FEN' })
      );
    });
  });

  // =========================================================================
  // findByEco
  // =========================================================================
  describe('findByEco', () => {
    it('should find traps by ECO code (prefix, case-insensitive)', async () => {
      const traps = [{ _id: '1', eco: 'C65' }];
      setupFindLeanChain(traps);
      mockReq.params.eco = 'C65';

      await service.findByEco(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({
        eco: { $regex: '^C65', $options: 'i' },
        isActive: true,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: traps,
        count: 1,
      });
    });

    it('should return 400 when eco is not provided', async () => {
      mockReq.params = {};

      await service.findByEco(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'ECO code is required',
      });
    });

    it('should return empty result when no traps match ECO', async () => {
      setupFindLeanChain([]);
      mockReq.params.eco = 'Z99';

      await service.findByEco(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: [],
        count: 0,
      });
    });

    it('should return 500 on database error', async () => {
      const lean = jest.fn().mockRejectedValue(new Error('DB error'));
      mocks.find.mockReturnValue({ lean });
      mockReq.params.eco = 'C65';

      await service.findByEco(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to find traps by ECO' })
      );
    });
  });

  // =========================================================================
  // findByCategoryId
  // =========================================================================
  describe('findByCategoryId', () => {
    it('should find traps by categoryId', async () => {
      const traps = [{ _id: '1', categoryId: 'cat-1' }];
      setupFindLeanChain(traps);
      mockReq.params.categoryId = 'cat-1';

      await service.findByCategoryId(mockReq, mockRes);

      expect(mocks.find).toHaveBeenCalledWith({ categoryId: 'cat-1', isActive: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: traps,
        count: 1,
      });
    });

    it('should return 400 when categoryId is not provided', async () => {
      mockReq.params = {};

      await service.findByCategoryId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category ID is required',
      });
    });

    it('should return 500 on database error', async () => {
      const lean = jest.fn().mockRejectedValue(new Error('DB error'));
      mocks.find.mockReturnValue({ lean });
      mockReq.params.categoryId = 'cat-1';

      await service.findByCategoryId(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to find traps by category' })
      );
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('should create a trap and return 201', async () => {
      const data = validTrapData();
      mockReq.body = data;
      mockSave.mockResolvedValue(undefined);

      await service.create(mockReq, mockRes);

      expect(TrapModel).toHaveBeenCalledWith(data);
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Trap created successfully',
        })
      );
    });

    it('should return 400 when required fields are missing', async () => {
      mockReq.body = { name: 'Incomplete Trap' };

      await service.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const jsonArg = mockRes.json.mock.calls[0][0];
      expect(jsonArg.success).toBe(false);
      expect(jsonArg.message).toContain('Missing required fields');
      expect(jsonArg.message).toContain('description');
      expect(jsonArg.message).toContain('setupFen');
    });

    it('should return 400 when body is completely empty', async () => {
      mockReq.body = {};

      await service.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const jsonArg = mockRes.json.mock.calls[0][0];
      expect(jsonArg.message).toContain('name');
      expect(jsonArg.message).toContain('benefitsColor');
    });

    it('should list all 8 required fields when none are provided', async () => {
      mockReq.body = {};

      await service.create(mockReq, mockRes);

      const jsonArg = mockRes.json.mock.calls[0][0];
      const requiredFields = [
        'name', 'description', 'setupFen', 'triggerMove',
        'triggerFen', 'explanation', 'keyIdea', 'benefitsColor',
      ];
      for (const field of requiredFields) {
        expect(jsonArg.message).toContain(field);
      }
    });

    it('should return 409 on duplicate trap (error code 11000)', async () => {
      const data = validTrapData();
      mockReq.body = data;
      const duplicateError: any = new Error('E11000 duplicate key error');
      duplicateError.code = 11000;
      mockSave.mockRejectedValue(duplicateError);

      await service.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Duplicate trap',
        message: 'A trap with this name already exists',
      });
    });

    it('should return 500 on generic database error', async () => {
      const data = validTrapData();
      mockReq.body = data;
      mockSave.mockRejectedValue(new Error('Validation failed'));

      await service.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to create trap',
          message: 'Validation failed',
        })
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe('update', () => {
    it('should update a trap and return the updated document', async () => {
      const updated = { _id: 'abc', name: 'Updated Trap' };
      mocks.findByIdAndUpdate.mockResolvedValue(updated);
      mockReq.params.id = 'abc';
      mockReq.body = { _id: 'abc', name: 'Updated Trap' };

      await service.update(mockReq, mockRes);

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
        'abc',
        {
          $set: expect.objectContaining({
            name: 'Updated Trap',
            updatedAt: expect.any(Date),
          }),
        },
        { new: true, runValidators: true }
      );
      // Verify _id was stripped from update payload
      const setArg = mocks.findByIdAndUpdate.mock.calls[0][1].$set;
      expect(setArg).not.toHaveProperty('_id');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: updated,
        message: 'Trap updated successfully',
      });
    });

    it('should return 404 when trap to update is not found', async () => {
      mocks.findByIdAndUpdate.mockResolvedValue(null);
      mockReq.params.id = 'nonexistent';
      mockReq.body = { name: 'Does not matter' };

      await service.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Trap with ID nonexistent not found',
      });
    });

    it('should return 500 on database error', async () => {
      mocks.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));
      mockReq.params.id = 'abc';
      mockReq.body = { name: 'Bad Update' };

      await service.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to update trap' })
      );
    });

    it('should set updatedAt to current date', async () => {
      const before = new Date();
      mocks.findByIdAndUpdate.mockResolvedValue({ _id: 'abc' });
      mockReq.params.id = 'abc';
      mockReq.body = { name: 'Test' };

      await service.update(mockReq, mockRes);

      const setArg = mocks.findByIdAndUpdate.mock.calls[0][1].$set;
      const after = new Date();
      expect(setArg.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(setArg.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe('delete', () => {
    describe('soft delete (default)', () => {
      it('should soft-delete by setting isActive=false', async () => {
        const deactivated = { _id: 'abc', isActive: false };
        mocks.findByIdAndUpdate.mockResolvedValue(deactivated);
        mockReq.params.id = 'abc';

        await service.delete(mockReq, mockRes);

        expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
          'abc',
          { $set: { isActive: false, updatedAt: expect.any(Date) } },
          { new: true }
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: deactivated,
          message: 'Trap deactivated',
        });
      });

      it('should return 404 on soft delete when trap not found', async () => {
        mocks.findByIdAndUpdate.mockResolvedValue(null);
        mockReq.params.id = 'nonexistent';

        await service.delete(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Trap with ID nonexistent not found',
        });
      });
    });

    describe('permanent delete', () => {
      it('should permanently delete when permanent="true" (string)', async () => {
        mocks.findByIdAndDelete.mockResolvedValue({ _id: 'abc' });
        mockReq.params.id = 'abc';
        mockReq.query.permanent = 'true';

        await service.delete(mockReq, mockRes);

        expect(mocks.findByIdAndDelete).toHaveBeenCalledWith('abc');
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: 'Trap permanently deleted',
        });
      });

      it('should permanently delete when permanent=true (boolean)', async () => {
        mocks.findByIdAndDelete.mockResolvedValue({ _id: 'abc' });
        mockReq.params.id = 'abc';
        mockReq.query.permanent = true;

        await service.delete(mockReq, mockRes);

        expect(mocks.findByIdAndDelete).toHaveBeenCalledWith('abc');
        expect(mockRes.status).toHaveBeenCalledWith(200);
      });

      it('should return 404 on permanent delete when trap not found', async () => {
        mocks.findByIdAndDelete.mockResolvedValue(null);
        mockReq.params.id = 'nonexistent';
        mockReq.query.permanent = 'true';

        await service.delete(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Trap with ID nonexistent not found',
        });
      });
    });

    it('should return 500 on database error during soft delete', async () => {
      mocks.findByIdAndUpdate.mockRejectedValue(new Error('DB error'));
      mockReq.params.id = 'abc';

      await service.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to delete trap' })
      );
    });

    it('should return 500 on database error during permanent delete', async () => {
      mocks.findByIdAndDelete.mockRejectedValue(new Error('DB error'));
      mockReq.params.id = 'abc';
      mockReq.query.permanent = 'true';

      await service.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to delete trap' })
      );
    });

    it('should not call findByIdAndDelete for soft delete', async () => {
      mocks.findByIdAndUpdate.mockResolvedValue({ _id: 'abc', isActive: false });
      mockReq.params.id = 'abc';

      await service.delete(mockReq, mockRes);

      expect(mocks.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should not call findByIdAndUpdate for permanent delete', async () => {
      mocks.findByIdAndDelete.mockResolvedValue({ _id: 'abc' });
      mockReq.params.id = 'abc';
      mockReq.query.permanent = 'true';

      await service.delete(mockReq, mockRes);

      expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // bulkImport
  // =========================================================================
  describe('bulkImport', () => {
    it('should return 400 when traps is not an array', async () => {
      mockReq.body = { traps: 'not-an-array' };

      await service.bulkImport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid request: traps array is required',
      });
    });

    it('should return 400 when traps is missing', async () => {
      mockReq.body = {};

      await service.bulkImport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid request: traps array is required',
      });
    });

    it('should return 400 when traps is null', async () => {
      mockReq.body = { traps: null };

      await service.bulkImport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should create new traps that do not exist by name', async () => {
      const trap1 = { name: 'New Trap A', description: 'desc' };
      const trap2 = { name: 'New Trap B', description: 'desc' };
      mockReq.body = { traps: [trap1, trap2] };

      mocks.findOne.mockResolvedValue(null);
      mockSave.mockResolvedValue(undefined);

      await service.bulkImport(mockReq, mockRes);

      expect(mocks.findOne).toHaveBeenCalledTimes(2);
      expect(mocks.findOne).toHaveBeenCalledWith({ name: 'New Trap A' });
      expect(mocks.findOne).toHaveBeenCalledWith({ name: 'New Trap B' });
      expect(TrapModel).toHaveBeenCalledTimes(2);
      expect(mockSave).toHaveBeenCalledTimes(2);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const json = mockRes.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.results.created).toBe(2);
      expect(json.results.updated).toBe(0);
      expect(json.results.errors).toHaveLength(0);
    });

    it('should skip existing traps when updateExisting is false (default)', async () => {
      const trap1 = { name: 'Existing Trap' };
      mockReq.body = { traps: [trap1] };

      mocks.findOne.mockResolvedValue({ _id: 'existing-id', name: 'Existing Trap' });

      await service.bulkImport(mockReq, mockRes);

      expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(TrapModel).not.toHaveBeenCalled();
      const json = mockRes.json.mock.calls[0][0];
      expect(json.results.created).toBe(0);
      expect(json.results.updated).toBe(0);
    });

    it('should update existing traps when updateExisting is true', async () => {
      const trap1 = { name: 'Existing Trap', description: 'updated desc' };
      mockReq.body = { traps: [trap1], updateExisting: true };

      mocks.findOne.mockResolvedValue({ _id: 'existing-id', name: 'Existing Trap' });
      mocks.findByIdAndUpdate.mockResolvedValue({ _id: 'existing-id' });

      await service.bulkImport(mockReq, mockRes);

      expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith('existing-id', { $set: trap1 });
      const json = mockRes.json.mock.calls[0][0];
      expect(json.results.updated).toBe(1);
      expect(json.results.created).toBe(0);
    });

    it('should collect errors for individual traps that fail', async () => {
      const trap1 = { name: 'Good Trap' };
      const trap2 = { name: 'Bad Trap' };
      mockReq.body = { traps: [trap1, trap2] };

      mocks.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockSave
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Validation failed'));

      await service.bulkImport(mockReq, mockRes);

      const json = mockRes.json.mock.calls[0][0];
      expect(json.success).toBe(true);
      expect(json.results.created).toBe(1);
      expect(json.results.errors).toHaveLength(1);
      expect(json.results.errors[0]).toEqual({
        name: 'Bad Trap',
        error: 'Validation failed',
      });
    });

    it('should handle an empty traps array', async () => {
      mockReq.body = { traps: [] };

      await service.bulkImport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const json = mockRes.json.mock.calls[0][0];
      expect(json.results.created).toBe(0);
      expect(json.results.updated).toBe(0);
      expect(json.results.errors).toHaveLength(0);
    });

    it('should include summary message in response', async () => {
      const trap1 = { name: 'New Trap' };
      const trap2 = { name: 'Existing Trap' };
      mockReq.body = { traps: [trap1, trap2], updateExisting: true };

      mocks.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: 'existing-id', name: 'Existing Trap' });
      mockSave.mockResolvedValue(undefined);
      mocks.findByIdAndUpdate.mockResolvedValue({ _id: 'existing-id' });

      await service.bulkImport(mockReq, mockRes);

      const json = mockRes.json.mock.calls[0][0];
      expect(json.message).toBe('Imported 1 traps, updated 1, 0 errors');
    });

    it('should return 500 on top-level error', async () => {
      mockReq.body = {
        get traps() {
          throw new Error('Unexpected top-level error');
        },
      };

      await service.bulkImport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to import traps' })
      );
    });
  });

  // =========================================================================
  // search
  // =========================================================================
  describe('search', () => {
    it('should return 400 when query is missing', async () => {
      mockReq.query = {};

      await service.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    });

    it('should return 400 when query is too short (1 char)', async () => {
      mockReq.query = { q: 'a' };

      await service.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    });

    it('should return 400 when query is an empty string', async () => {
      mockReq.query = { q: '' };

      await service.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should search with regex across multiple fields', async () => {
      const traps = [{ _id: '1', name: 'Fishing Pole' }];
      const { limit } = setupSearchChain(traps);

      mockReq.query = { q: 'Fishing', limit: '10' };

      await service.search(mockReq, mockRes);

      // Verify the $or contains all five searchable fields
      expect(mocks.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          $or: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(RegExp) }),
            expect.objectContaining({ openingName: expect.any(RegExp) }),
            expect.objectContaining({ eco: expect.any(RegExp) }),
            expect.objectContaining({ tags: expect.any(RegExp) }),
            expect.objectContaining({ description: expect.any(RegExp) }),
          ]),
        })
      );
      expect(limit).toHaveBeenCalledWith(10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: traps,
        count: 1,
      });
    });

    it('should use default limit of 20 when not specified', async () => {
      const { limit } = setupSearchChain([]);
      mockReq.query = { q: 'trap' };

      await service.search(mockReq, mockRes);

      expect(limit).toHaveBeenCalledWith(20);
    });

    it('should use case-insensitive regex', async () => {
      setupSearchChain([]);
      mockReq.query = { q: 'FiShInG' };

      await service.search(mockReq, mockRes);

      const findArg = mocks.find.mock.calls[0][0];
      const nameRegex: RegExp = findArg.$or[0].name;
      expect(nameRegex.flags).toContain('i');
    });

    it('should accept exactly 2-character queries', async () => {
      setupSearchChain([]);
      mockReq.query = { q: 'ab' };

      await service.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on database error', async () => {
      const lean = jest.fn().mockRejectedValue(new Error('Search error'));
      const limit = jest.fn().mockReturnValue({ lean });
      mocks.find.mockReturnValue({ limit });

      mockReq.query = { q: 'trap' };

      await service.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Search failed' })
      );
    });
  });

  // =========================================================================
  // getStats
  // =========================================================================
  describe('getStats', () => {
    it('should return aggregated statistics', async () => {
      mocks.aggregate.mockResolvedValue([
        {
          _id: null,
          total: 5,
          byDifficulty: ['beginner', 'beginner', 'intermediate', 'advanced', 'advanced'],
          byTrapType: ['tactical', 'tactical', 'positional', 'mating', 'tactical'],
          byBenefitsColor: ['white', 'white', 'black', 'white', 'black'],
        },
      ]);

      await service.getStats(mockReq, mockRes);

      expect(mocks.aggregate).toHaveBeenCalledWith([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byDifficulty: { $push: '$difficulty' },
            byTrapType: { $push: '$trapType' },
            byBenefitsColor: { $push: '$benefitsColor' },
          },
        },
      ]);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: {
          total: 5,
          byDifficulty: { beginner: 2, intermediate: 1, advanced: 2 },
          byTrapType: { tactical: 3, positional: 1, mating: 1 },
          byBenefitsColor: { white: 3, black: 2 },
        },
      });
    });

    it('should return empty stats when no traps exist', async () => {
      mocks.aggregate.mockResolvedValue([]);

      await service.getStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: {
          total: 0,
          byDifficulty: {},
          byTrapType: {},
          byBenefitsColor: {},
        },
      });
    });

    it('should correctly count occurrences with a single category each', async () => {
      mocks.aggregate.mockResolvedValue([
        {
          _id: null,
          total: 1,
          byDifficulty: ['beginner'],
          byTrapType: ['mating'],
          byBenefitsColor: ['black'],
        },
      ]);

      await service.getStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        result: {
          total: 1,
          byDifficulty: { beginner: 1 },
          byTrapType: { mating: 1 },
          byBenefitsColor: { black: 1 },
        },
      });
    });

    it('should return 500 on database error', async () => {
      mocks.aggregate.mockRejectedValue(new Error('Aggregation failed'));

      await service.getStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to get trap statistics',
          message: 'Aggregation failed',
        })
      );
    });
  });
});
