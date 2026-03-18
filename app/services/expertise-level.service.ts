import { ExpertiseLevelModel, IExpertiseLevel } from '../models/expertise-level.model';

export class ExpertiseLevelService {
  constructor() {
    console.log('[ExpertiseLevelService] Initialized');
  }

  public async getByRootCategory(req, res) {
    try {
      const { rootCategoryId } = req.query;

      if (!rootCategoryId) {
        return res.status(400).json({
          success: false,
          message: 'rootCategoryId query parameter is required'
        });
      }

      const levels = await ExpertiseLevelModel.find({
        rootCategoryId,
        isActive: true
      })
        .sort({ order: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        result: levels,
        count: levels.length
      });
    } catch (error) {
      console.error('[ExpertiseLevelService.getByRootCategory] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve expertise levels',
        message: error.message
      });
    }
  }

  public async getById(req, res) {
    try {
      const { id } = req.params;
      const level = await ExpertiseLevelModel.findById(id).lean();

      if (!level) {
        return res.status(404).json({
          success: false,
          message: `Expertise level with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        result: level
      });
    } catch (error) {
      console.error('[ExpertiseLevelService.getById] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve expertise level',
        message: error.message
      });
    }
  }

  public async create(req, res) {
    try {
      const data: IExpertiseLevel = req.body;

      const requiredFields = ['rootCategoryId', 'name'];
      const missing = requiredFields.filter(field => !data[field]);

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missing.join(', ')}`
        });
      }

      // If this is set as default, unset any existing default for same rootCategoryId
      if (data.isDefault) {
        await ExpertiseLevelModel.updateMany(
          { rootCategoryId: data.rootCategoryId, isDefault: true },
          { $set: { isDefault: false } }
        );
      }

      // Set order to max + 1 if not provided
      if (data.order === undefined || data.order === null) {
        const maxOrder = await ExpertiseLevelModel.findOne({ rootCategoryId: data.rootCategoryId })
          .sort({ order: -1 })
          .select('order')
          .lean();
        data.order = (maxOrder?.order ?? -1) + 1;
      }

      const level = new ExpertiseLevelModel(data);
      await level.save();

      return res.status(201).json({
        success: true,
        result: level,
        message: 'Expertise level created successfully'
      });
    } catch (error) {
      console.error('[ExpertiseLevelService.create] Error:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate expertise level',
          message: 'An expertise level with this name already exists'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to create expertise level',
        message: error.message
      });
    }
  }

  public async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      delete updateData._id;

      // If setting as default, unset any existing default for same rootCategoryId
      if (updateData.isDefault) {
        const existing = await ExpertiseLevelModel.findById(id).lean();
        if (existing) {
          await ExpertiseLevelModel.updateMany(
            { rootCategoryId: existing.rootCategoryId, isDefault: true, _id: { $ne: id } },
            { $set: { isDefault: false } }
          );
        }
      }

      const level = await ExpertiseLevelModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!level) {
        return res.status(404).json({
          success: false,
          message: `Expertise level with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        result: level,
        message: 'Expertise level updated successfully'
      });
    } catch (error) {
      console.error('[ExpertiseLevelService.update] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update expertise level',
        message: error.message
      });
    }
  }

  public async delete(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      if (permanent === 'true' || permanent === true) {
        const result = await ExpertiseLevelModel.findByIdAndDelete(id);
        if (!result) {
          return res.status(404).json({
            success: false,
            message: `Expertise level with ID ${id} not found`
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Expertise level permanently deleted'
        });
      } else {
        const level = await ExpertiseLevelModel.findByIdAndUpdate(
          id,
          { $set: { isActive: false, updatedAt: new Date() } },
          { new: true }
        );
        if (!level) {
          return res.status(404).json({
            success: false,
            message: `Expertise level with ID ${id} not found`
          });
        }
        return res.status(200).json({
          success: true,
          result: level,
          message: 'Expertise level deactivated'
        });
      }
    } catch (error) {
      console.error('[ExpertiseLevelService.delete] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete expertise level',
        message: error.message
      });
    }
  }

  public async reorder(req, res) {
    try {
      const { levelIds } = req.body;

      if (!levelIds || !Array.isArray(levelIds)) {
        return res.status(400).json({
          success: false,
          message: 'levelIds array is required'
        });
      }

      const bulkOps = levelIds.map((id: string, index: number) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: index } }
        }
      }));

      await ExpertiseLevelModel.bulkWrite(bulkOps);

      return res.status(200).json({
        success: true,
        message: 'Expertise levels reordered successfully'
      });
    } catch (error) {
      console.error('[ExpertiseLevelService.reorder] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reorder expertise levels',
        message: error.message
      });
    }
  }
}
