import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IExpertiseLevel } from './schemas/expertise-level.schema';

@Injectable()
export class ExpertiseLevelsService {
  private readonly logger = new Logger(ExpertiseLevelsService.name);

  constructor(@InjectModel('ExpertiseLevel') private readonly model: Model<IExpertiseLevel>) {
    this.logger.log('ExpertiseLevelsService initialized');
  }

  async getByRootCategory(query: any = {}): Promise<{ success: boolean; result: IExpertiseLevel[] }> {
    const filter: any = { isActive: true };
    if (query.rootCategoryId) {
      filter.rootCategoryId = query.rootCategoryId;
    }

    const data = await this.model.find(filter).sort({ order: 1 }).lean();
    return { success: true, result: data };
  }

  async getById(id: string): Promise<IExpertiseLevel> {
    const level = await this.model.findById(id).lean();
    if (!level) {
      throw new NotFoundException(`ExpertiseLevel with ID ${id} not found`);
    }
    return level;
  }

  async create(body: Partial<IExpertiseLevel>): Promise<{ success: boolean; result: IExpertiseLevel }> {
    if (!body.rootCategoryId || !body.name) {
      throw new BadRequestException('rootCategoryId and name are required');
    }

    // Auto-assign order if not provided
    if (body.order === undefined) {
      const maxDoc = await this.model.findOne({ rootCategoryId: body.rootCategoryId }).sort({ order: -1 }).lean();
      body.order = maxDoc ? maxDoc.order + 1 : 0;
    }

    // Ensure only one default per rootCategory
    if (body.isDefault) {
      await this.model.updateMany(
        { rootCategoryId: body.rootCategoryId, isDefault: true },
        { $set: { isDefault: false } },
      );
    }

    const doc = await this.model.create(body);
    return { success: true, result: doc.toObject() };
  }

  async update(id: string, body: Partial<IExpertiseLevel>): Promise<{ success: boolean; result: IExpertiseLevel }> {
    const { _id, ...data } = body as any;

    // Ensure only one default per rootCategory
    if (data.isDefault) {
      const existing = await this.model.findById(id).lean();
      if (existing) {
        await this.model.updateMany(
          { rootCategoryId: existing.rootCategoryId, isDefault: true, _id: { $ne: id } },
          { $set: { isDefault: false } },
        );
      }
    }

    const updated = await this.model.findByIdAndUpdate(id, data, { new: true, lean: true });
    if (!updated) {
      throw new NotFoundException(`ExpertiseLevel with ID ${id} not found`);
    }
    return { success: true, result: updated };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`ExpertiseLevel with ID ${id} not found`);
    }
    return { success: true, message: `ExpertiseLevel ${id} deleted` };
  }

  async reorder(body: { levelIds: string[] }): Promise<{ success: boolean; message: string }> {
    if (!body.levelIds?.length) {
      throw new BadRequestException('levelIds array is required');
    }

    const ops = body.levelIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await this.model.bulkWrite(ops);
    return { success: true, message: `Reordered ${body.levelIds.length} levels` };
  }
}
