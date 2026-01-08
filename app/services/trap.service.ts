import { TrapModel, ITrap } from '../models/trap.model';

/**
 * Service for managing chess opening traps
 * Provides CRUD operations and specialized queries for trap data
 */
export class TrapService {
  constructor() {
    console.log('[TrapService] Initialized');
  }

  /**
   * Get all traps with optional filters
   */
  public async getAll(req, res) {
    try {
      const {
        eco,
        categoryId,
        difficulty,
        trapType,
        frequency,
        benefitsColor,
        isActive = true,
        limit = 100,
        skip = 0
      } = req.query;

      const query: any = {};

      if (isActive !== undefined) {
        query.isActive = isActive === 'true' || isActive === true;
      }
      if (eco) query.eco = eco;
      if (categoryId) query.categoryId = categoryId;
      if (difficulty) query.difficulty = difficulty;
      if (trapType) query.trapType = trapType;
      if (frequency) query.frequency = frequency;
      if (benefitsColor) query.benefitsColor = benefitsColor;

      console.log('[TrapService.getAll] Query:', query);

      const traps = await TrapModel.find(query)
        .sort({ name: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean();

      const total = await TrapModel.countDocuments(query);

      return res.status(200).json({
        success: true,
        result: traps,
        count: traps.length,
        total
      });
    } catch (error) {
      console.error('[TrapService.getAll] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve traps',
        message: error.message
      });
    }
  }

  /**
   * Get a single trap by ID
   */
  public async getById(req, res) {
    try {
      const { id } = req.params;

      const trap = await TrapModel.findById(id).lean();

      if (!trap) {
        return res.status(404).json({
          success: false,
          message: `Trap with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        result: trap
      });
    } catch (error) {
      console.error('[TrapService.getById] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve trap',
        message: error.message
      });
    }
  }

  /**
   * Find traps by FEN position (exact or prefix match)
   * Used during opening practice to check for known traps
   */
  public async findByFen(req, res) {
    try {
      const { fen, matchType = 'exact' } = req.body;

      if (!fen) {
        return res.status(400).json({
          success: false,
          message: 'FEN position is required'
        });
      }

      let query: any = { isActive: true };

      if (matchType === 'exact') {
        // Exact match on setupFen or triggerFen
        query.$or = [
          { setupFen: fen },
          { triggerFen: fen }
        ];
      } else {
        // Prefix match (position without move counters)
        const fenPrefix = fen.split(' ').slice(0, 4).join(' ');
        query.$or = [
          { setupFen: { $regex: `^${fenPrefix}` } },
          { triggerFen: { $regex: `^${fenPrefix}` } }
        ];
      }

      console.log('[TrapService.findByFen] Query:', query);

      const traps = await TrapModel.find(query).lean();

      return res.status(200).json({
        success: true,
        result: traps,
        count: traps.length
      });
    } catch (error) {
      console.error('[TrapService.findByFen] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to find traps by FEN',
        message: error.message
      });
    }
  }

  /**
   * Find traps by ECO code
   */
  public async findByEco(req, res) {
    try {
      const { eco } = req.params;

      if (!eco) {
        return res.status(400).json({
          success: false,
          message: 'ECO code is required'
        });
      }

      const traps = await TrapModel.find({
        eco: { $regex: `^${eco}`, $options: 'i' },
        isActive: true
      }).lean();

      return res.status(200).json({
        success: true,
        result: traps,
        count: traps.length
      });
    } catch (error) {
      console.error('[TrapService.findByEco] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to find traps by ECO',
        message: error.message
      });
    }
  }

  /**
   * Find traps by category ID
   */
  public async findByCategoryId(req, res) {
    try {
      const { categoryId } = req.params;

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Category ID is required'
        });
      }

      const traps = await TrapModel.find({
        categoryId,
        isActive: true
      }).lean();

      return res.status(200).json({
        success: true,
        result: traps,
        count: traps.length
      });
    } catch (error) {
      console.error('[TrapService.findByCategoryId] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to find traps by category',
        message: error.message
      });
    }
  }

  /**
   * Create a new trap
   */
  public async create(req, res) {
    try {
      const trapData: ITrap = req.body;

      console.log('[TrapService.create] Creating trap:', trapData.name);

      // Validate required fields
      const requiredFields = ['name', 'description', 'setupFen', 'triggerMove', 'triggerFen', 'explanation', 'keyIdea', 'benefitsColor'];
      const missing = requiredFields.filter(field => !trapData[field]);

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missing.join(', ')}`
        });
      }

      const trap = new TrapModel(trapData);
      await trap.save();

      console.log('[TrapService.create] Trap created:', trap._id);

      return res.status(201).json({
        success: true,
        result: trap,
        message: 'Trap created successfully'
      });
    } catch (error) {
      console.error('[TrapService.create] Error:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate trap',
          message: 'A trap with this name already exists'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to create trap',
        message: error.message
      });
    }
  }

  /**
   * Update a trap
   */
  public async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('[TrapService.update] Updating trap:', id);

      // Remove _id from update data to prevent immutable field error
      delete updateData._id;
      updateData.updatedAt = new Date();

      const trap = await TrapModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!trap) {
        return res.status(404).json({
          success: false,
          message: `Trap with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        result: trap,
        message: 'Trap updated successfully'
      });
    } catch (error) {
      console.error('[TrapService.update] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update trap',
        message: error.message
      });
    }
  }

  /**
   * Delete a trap (soft delete by setting isActive = false)
   */
  public async delete(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      console.log('[TrapService.delete] Deleting trap:', id, { permanent });

      if (permanent === 'true' || permanent === true) {
        // Permanent delete
        const result = await TrapModel.findByIdAndDelete(id);

        if (!result) {
          return res.status(404).json({
            success: false,
            message: `Trap with ID ${id} not found`
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Trap permanently deleted'
        });
      } else {
        // Soft delete
        const trap = await TrapModel.findByIdAndUpdate(
          id,
          { $set: { isActive: false, updatedAt: new Date() } },
          { new: true }
        );

        if (!trap) {
          return res.status(404).json({
            success: false,
            message: `Trap with ID ${id} not found`
          });
        }

        return res.status(200).json({
          success: true,
          result: trap,
          message: 'Trap deactivated'
        });
      }
    } catch (error) {
      console.error('[TrapService.delete] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete trap',
        message: error.message
      });
    }
  }

  /**
   * Bulk import traps
   */
  public async bulkImport(req, res) {
    try {
      const { traps, updateExisting = false } = req.body;

      if (!traps || !Array.isArray(traps)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request: traps array is required'
        });
      }

      console.log('[TrapService.bulkImport] Importing', traps.length, 'traps');

      const results = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const trapData of traps) {
        try {
          // Check if trap exists by name
          const existing = await TrapModel.findOne({ name: trapData.name });

          if (existing) {
            if (updateExisting) {
              await TrapModel.findByIdAndUpdate(existing._id, { $set: trapData });
              results.updated++;
            }
          } else {
            const trap = new TrapModel(trapData);
            await trap.save();
            results.created++;
          }
        } catch (err) {
          results.errors.push({
            name: trapData.name,
            error: err.message
          });
        }
      }

      console.log('[TrapService.bulkImport] Results:', results);

      return res.status(200).json({
        success: true,
        results,
        message: `Imported ${results.created} traps, updated ${results.updated}, ${results.errors.length} errors`
      });
    } catch (error) {
      console.error('[TrapService.bulkImport] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to import traps',
        message: error.message
      });
    }
  }

  /**
   * Search traps by text
   */
  public async search(req, res) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q || String(q).length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const searchRegex = new RegExp(String(q), 'i');

      const traps = await TrapModel.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { openingName: searchRegex },
          { eco: searchRegex },
          { tags: searchRegex },
          { description: searchRegex }
        ]
      })
        .limit(Number(limit))
        .lean();

      return res.status(200).json({
        success: true,
        result: traps,
        count: traps.length
      });
    } catch (error) {
      console.error('[TrapService.search] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Search failed',
        message: error.message
      });
    }
  }

  /**
   * Get trap statistics
   */
  public async getStats(req, res) {
    try {
      const stats = await TrapModel.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byDifficulty: {
              $push: '$difficulty'
            },
            byTrapType: {
              $push: '$trapType'
            },
            byBenefitsColor: {
              $push: '$benefitsColor'
            }
          }
        }
      ]);

      if (!stats.length) {
        return res.status(200).json({
          success: true,
          result: {
            total: 0,
            byDifficulty: {},
            byTrapType: {},
            byBenefitsColor: {}
          }
        });
      }

      // Count occurrences
      const countOccurrences = (arr: string[]) => {
        return arr.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      };

      return res.status(200).json({
        success: true,
        result: {
          total: stats[0].total,
          byDifficulty: countOccurrences(stats[0].byDifficulty),
          byTrapType: countOccurrences(stats[0].byTrapType),
          byBenefitsColor: countOccurrences(stats[0].byBenefitsColor)
        }
      });
    } catch (error) {
      console.error('[TrapService.getStats] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get trap statistics',
        message: error.message
      });
    }
  }
}
