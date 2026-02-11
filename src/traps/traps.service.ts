import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITrap } from './schemas/trap.schema';

@Injectable()
export class TrapsService {
  private readonly logger = new Logger(TrapsService.name);

  constructor(@InjectModel('Trap') private readonly trapModel: Model<ITrap>) {
    this.logger.log('TrapsService initialized');
  }

  async getAll(query: any = {}): Promise<{ success: boolean; data: ITrap[]; total: number }> {
    try {
      const filter: any = {};

      // isActive filter (default true)
      const isActive = query.isActive !== undefined ? query.isActive : true;
      filter.isActive = isActive === 'false' || isActive === false ? false : true;

      if (query.eco) filter.eco = query.eco;
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.difficulty) filter.difficulty = query.difficulty;
      if (query.trapType) filter.trapType = query.trapType;
      if (query.frequency) filter.frequency = query.frequency;
      if (query.benefitsColor) filter.benefitsColor = query.benefitsColor;

      this.logger.log(`[TrapsService.getAll] Query: ${JSON.stringify(filter)}`);

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 50;
      const skip = (page - 1) * limit;
      const sort = query.sort || '-createdAt';

      const [data, total] = await Promise.all([
        this.trapModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        this.trapModel.countDocuments(filter),
      ]);

      return { success: true, data, total };
    } catch (error) {
      this.logger.error(`[TrapsService.getAll] Error: ${error}`);
      throw error;
    }
  }

  async getById(id: string): Promise<ITrap> {
    const trap = await this.trapModel.findById(id).lean();
    if (!trap) {
      throw new NotFoundException(`Trap with ID ${id} not found`);
    }
    return trap;
  }

  async findByFen(fen: string, matchType?: string): Promise<{ success: boolean; data: ITrap[] }> {
    if (!fen) {
      throw new BadRequestException('FEN position is required');
    }

    let query: any;
    if (matchType === 'prefix') {
      const fenPrefix = fen.split(' ')[0];
      query = {
        $or: [
          { setupFen: { $regex: `^${fenPrefix}` } },
          { triggerFen: { $regex: `^${fenPrefix}` } },
        ],
      };
    } else {
      query = {
        $or: [{ setupFen: fen }, { triggerFen: fen }],
      };
    }

    const data = await this.trapModel.find(query).lean();
    return { success: true, data };
  }

  async findByEco(eco: string): Promise<{ success: boolean; data: ITrap[] }> {
    if (!eco) {
      throw new BadRequestException('ECO code is required');
    }

    const data = await this.trapModel
      .find({ eco: { $regex: `^${eco}`, $options: 'i' }, isActive: true })
      .lean();

    return { success: true, data };
  }

  async findByCategoryId(categoryId: string): Promise<{ success: boolean; data: ITrap[] }> {
    if (!categoryId) {
      throw new BadRequestException('Category ID is required');
    }

    const data = await this.trapModel
      .find({ categoryId, isActive: true })
      .lean();

    return { success: true, data };
  }

  async create(trapData: Partial<ITrap>): Promise<ITrap> {
    const requiredFields = ['name', 'description', 'setupFen', 'triggerMove', 'triggerFen', 'explanation', 'keyIdea', 'benefitsColor'];
    const missing = requiredFields.filter(f => !trapData[f]);

    if (missing.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
    }

    try {
      const trap = await this.trapModel.create(trapData);
      return trap.toObject();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('A trap with this data already exists');
      }
      throw error;
    }
  }

  async update(id: string, updateData: Partial<ITrap>): Promise<ITrap> {
    const { _id, ...dataWithoutId } = updateData as any;

    const updated = await this.trapModel.findByIdAndUpdate(
      id,
      { ...dataWithoutId, updatedAt: new Date() },
      { new: true, lean: true },
    );

    if (!updated) {
      throw new NotFoundException(`Trap with ID ${id} not found`);
    }

    return updated;
  }

  async delete(id: string, permanent = false): Promise<{ success: boolean; message: string }> {
    if (permanent) {
      const result = await this.trapModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException(`Trap with ID ${id} not found`);
      }
      return { success: true, message: `Trap ${id} permanently deleted` };
    }

    const result = await this.trapModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!result) {
      throw new NotFoundException(`Trap with ID ${id} not found`);
    }
    return { success: true, message: `Trap ${id} soft deleted` };
  }

  async bulkImport(body: any): Promise<{ success: boolean; message: string; created: number; updated: number; errors: any[] }> {
    const traps = body?.traps || body;
    if (!Array.isArray(traps) || traps.length === 0) {
      throw new BadRequestException('Request body must contain an array of traps');
    }

    let created = 0;
    let updated = 0;
    const errors: any[] = [];

    for (const trapData of traps) {
      try {
        const existing = await this.trapModel.findOne({
          name: trapData.name,
          setupFen: trapData.setupFen,
        });

        if (existing) {
          if (trapData.update !== false) {
            await this.trapModel.findByIdAndUpdate(existing._id, trapData);
            updated++;
          }
        } else {
          await this.trapModel.create(trapData);
          created++;
        }
      } catch (error) {
        errors.push({ name: trapData.name, error: error.message });
      }
    }

    return {
      success: true,
      message: `Import complete: ${created} created, ${updated} updated, ${errors.length} errors`,
      created,
      updated,
      errors,
    };
  }

  async search(q: string, limit = 20): Promise<{ success: boolean; data: ITrap[] }> {
    if (!q || q.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const regex = new RegExp(q.trim(), 'i');
    const data = await this.trapModel
      .find({
        $or: [
          { name: regex },
          { description: regex },
          { openingName: regex },
          { keyIdea: regex },
          { eco: regex },
        ],
        isActive: true,
      })
      .limit(limit)
      .lean();

    return { success: true, data };
  }

  async getStats(): Promise<any> {
    try {
      const [total, active, byDifficulty, byTrapType, byEco] = await Promise.all([
        this.trapModel.countDocuments(),
        this.trapModel.countDocuments({ isActive: true }),
        this.trapModel.aggregate([
          { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        ]),
        this.trapModel.aggregate([
          { $group: { _id: '$trapType', count: { $sum: 1 } } },
        ]),
        this.trapModel.aggregate([
          { $group: { _id: '$eco', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
      ]);

      return {
        success: true,
        stats: { total, active, byDifficulty, byTrapType, topEcoCodes: byEco },
      };
    } catch (error) {
      this.logger.error(`[TrapsService.getStats] Error: ${error}`);
      throw error;
    }
  }
}
