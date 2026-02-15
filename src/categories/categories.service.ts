import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ICategory } from './schemas/category.schema';
import { CategoryTreeService } from './category-tree.service';
import { TranslationService } from '../translation/translation.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectModel('Categories') private readonly categoryModel: Model<ICategory>,
    private readonly treeService: CategoryTreeService,
    private readonly translationService: TranslationService,
  ) {}

  /**
   * Coerce a string ID to ObjectId when it looks like one (24 hex chars).
   * Schema uses _id: Mixed, so Mongoose won't auto-cast. Without this,
   * findById("abc123...") queries for a string but the DB stores ObjectId → no match → 404.
   */
  private coerceId(id: string): any {
    if (/^[a-fA-F0-9]{24}$/.test(id)) {
      return new Types.ObjectId(id);
    }
    return id;
  }

  async getAll(query?: Record<string, any>): Promise<{ result: any[]; count: number }> {
    this.logger.log('Getting all categories');
    if (query?.all === 'true') {
      const result = await this.categoryModel.find().select('-children').lean();
      return { result, count: result.length };
    }
    // Return main categories with shallow children (name, _id, childrenCount only).
    // This keeps the response small while providing enough data for tile navigation.
    // Deep children are loaded on-demand via GET /categories/:id/shallow-children.
    // See: https://github.com/kasparov112000/learnbytesting-ai/issues/80
    const result = await this.categoryModel.aggregate([
      { $match: { 'children.0': { $exists: true } } },
      {
        $addFields: {
          children: {
            $map: {
              input: '$children',
              as: 'child',
              in: {
                _id: '$$child._id',
                name: '$$child.name',
                isActive: '$$child.isActive',
                childrenCount: { $size: { $ifNull: ['$$child.children', []] } },
              },
            },
          },
        },
      },
    ]);
    return { result, count: result.length };
  }

  /**
   * Get shallow children for a category at any nesting level.
   * Returns immediate children with _id, name, isActive, childrenCount — no grandchildren.
   * Used by the frontend for lazy-loaded drill-down navigation.
   * See: https://github.com/kasparov112000/learnbytesting-ai/issues/80
   */
  async getShallowChildren(id: string): Promise<{ result: any[]; parentName: string }> {
    this.logger.log(`Getting shallow children for category: ${id}`);
    const allCategories = await this.categoryModel.find().lean();
    const found = this.treeService.findInTree(allCategories, id);

    if (!found) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const shallowChildren = (found.children || []).map((child: any) => ({
      _id: child._id,
      name: child.name,
      isActive: child.isActive,
      childrenCount: Array.isArray(child.children) ? child.children.length : 0,
    }));

    return { result: shallowChildren, parentName: found.name };
  }

  async getById(id: string): Promise<ICategory> {
    this.logger.log(`Getting category by ID: ${id}`);
    const result = await this.categoryModel.findById(this.coerceId(id)).lean();
    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return result;
  }

  async createCategory(body: any, req: any): Promise<any> {
    this.logger.log(`Creating category: ${body.name}`);

    if (body.parent) {
      return this.treeService.createNewCategory(body, req);
    }

    // Root category
    const newCategory: any = {
      ...body,
      _id: body._id || uuidv4(),
      createUuid: body.createUuid || uuidv4(),
      createCreatedDate: new Date(),
      createdDate: new Date(),
      modifiedDate: new Date(),
      active: body.active !== undefined ? body.active : true,
      isActive: body.isActive !== undefined ? body.isActive : true,
      children: body.children || [],
    };

    if (req?.body?.currentUser?.info?.guid) {
      newCategory.createdByGuid = req.body.currentUser.info.guid;
      newCategory.modifiedByGuid = req.body.currentUser.info.guid;
    }

    const created = await this.categoryModel.create(newCategory);
    return created.toObject();
  }

  async updateCategoryById(id: string, body: any, req: any): Promise<any> {
    this.logger.log(`Updating category: ${id}`);

    // First try direct root-level lookup
    const coercedId = this.coerceId(id);
    const rootDoc = await this.categoryModel.findById(coercedId).lean();
    if (rootDoc) {
      this.logger.log(`Found category at root level: ${rootDoc.name}`);
      const updated = this.treeService.getUpdatedCategory(rootDoc, body);
      updated.modifiedDate = new Date();
      if (req?.body?.currentUser?.info?.guid) {
        updated.modifiedByGuid = req.body.currentUser.info.guid;
      }
      const { _id, ...updateFields } = updated;
      const result = await this.categoryModel.findByIdAndUpdate(coercedId, { $set: updateFields }, { new: true, lean: true });
      return result;
    }

    // Not a root document — search recursively in nested children
    this.logger.log(`Category ${id} not found at root, searching nested tree...`);
    const allRoots = await this.categoryModel.find().lean();

    for (const root of allRoots) {
      const found = this.treeService.findInTree(root.children || [], id);
      if (found) {
        this.logger.log(`Found category nested inside root: ${root.name} (${root._id})`);

        // Merge update data into the nested child, preserving immutable and structural fields
        const updateInChildren = (children: any[]): boolean => {
          for (let i = 0; i < children.length; i++) {
            if (String(children[i]._id) === String(id)) {
              const original = children[i];
              // Preserve structural fields that the frontend may send as shallow/stale
              const preservedChildren = original.children;
              const preservedId = original._id;
              const preservedParent = original.parent;
              const preservedCreatedDate = original.createdDate;
              const preservedCreateCreatedDate = original.createCreatedDate;
              const preservedCreateUuid = original.createUuid;

              // Merge only non-structural fields from body
              const { children: _ignoreChildren, _id: _ignoreId, ...safeBody } = body;
              Object.assign(original, safeBody);

              // Restore preserved fields
              original._id = preservedId;
              original.parent = preservedParent;
              original.children = preservedChildren;
              original.createdDate = preservedCreatedDate;
              original.createCreatedDate = preservedCreateCreatedDate;
              original.createUuid = preservedCreateUuid;
              original.modifiedDate = new Date();
              return true;
            }
            if (children[i].children && updateInChildren(children[i].children)) {
              return true;
            }
          }
          return false;
        };

        // Work on a mutable copy of root's children
        const childrenCopy = JSON.parse(JSON.stringify(root.children));
        updateInChildren(childrenCopy);

        const result = await this.categoryModel.findByIdAndUpdate(
          root._id,
          { $set: { children: childrenCopy, modifiedDate: new Date() } },
          { new: true, lean: true },
        );
        return result;
      }
    }

    throw new NotFoundException(`Category with ID ${id} not found`);
  }

  async delete(id: string): Promise<any> {
    this.logger.log(`Deleting category: ${id}`);
    const result = await this.categoryModel.findByIdAndDelete(this.coerceId(id));
    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return { success: true, message: `Category ${id} deleted` };
  }

  async findCategoryInTree(id: string): Promise<any> {
    if (!id) {
      throw new BadRequestException('Category ID is required');
    }

    const allCategories = await this.categoryModel.find().lean();
    const found = this.treeService.findInTree(allCategories, id);

    if (!found) {
      throw new NotFoundException(`Category with ID ${id} not found in tree`);
    }

    return found;
  }

  async getCategoryWithResolvedAiConfig(id: string): Promise<any> {
    const allCategories = await this.categoryModel.find().lean();
    const found = this.treeService.findInTree(allCategories, id);

    if (!found) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Resolve inherited AI config
    const resolvedConfig = this.treeService.resolveAiConfig(allCategories, found);
    return { ...found, resolvedAiConfig: resolvedConfig };
  }

  async updateCategoryAiConfig(id: string, aiConfig: any): Promise<any> {
    const result = await this.categoryModel.findByIdAndUpdate(
      this.coerceId(id),
      { $set: { aiConfig } },
      { new: true, lean: true },
    );

    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return result;
  }

  async importCategoryTree(body: any): Promise<any> {
    const categories = body.categories || body;
    if (!Array.isArray(categories)) {
      throw new BadRequestException('Import data must be an array of categories');
    }

    const results = [];
    for (const category of categories) {
      const created = await this.categoryModel.create({
        ...category,
        _id: category._id || uuidv4(),
        createUuid: category.createUuid || uuidv4(),
        createCreatedDate: new Date(),
      });
      results.push(created.toObject());
    }

    return { success: true, imported: results.length, categories: results };
  }

  async exportCategoryTree(): Promise<any> {
    const categories = await this.categoryModel.find().lean();
    return { success: true, count: categories.length, categories };
  }

  async ensureSubcategory(body: any): Promise<any> {
    const { parentId, name, ...rest } = body;

    if (!parentId || !name) {
      throw new BadRequestException('parentId and name are required');
    }

    // Check if subcategory already exists
    const allCategories = await this.categoryModel.find().lean();
    const parent = this.treeService.findInTree(allCategories, parentId);

    if (!parent) {
      throw new NotFoundException(`Parent category ${parentId} not found`);
    }

    const existing = (parent.children || []).find((c: any) => c.name === name);
    if (existing) {
      return { success: true, existed: true, category: existing };
    }

    // Create new subcategory under parent
    const newChild = {
      _id: uuidv4(),
      name,
      createUuid: uuidv4(),
      createCreatedDate: new Date(),
      active: true,
      isActive: true,
      children: [],
      parent: parentId,
      ...rest,
    };

    // Add to parent's children array
    await this.categoryModel.findByIdAndUpdate(
      parent._id,
      { $push: { children: newChild } },
    );

    return { success: true, existed: false, category: newChild };
  }

  async getCategoriesWithTranslation(targetLang: string): Promise<any> {
    const categories = await this.categoryModel.find().lean();

    if (!targetLang || targetLang === 'en') {
      return { result: categories, count: categories.length };
    }

    // Apply translations
    const translated = categories.map((cat: any) => ({
      ...cat,
      name: cat.translations?.[targetLang] || cat.name,
    }));

    return { result: translated, count: translated.length };
  }

  async translateOpeningName(openingName: string, eco: string, targetLang: string): Promise<any> {
    if (!openingName) {
      throw new BadRequestException('Opening name is required');
    }

    const translated = await this.translationService.translate(openingName, 'en', targetLang || 'es');
    return { original: openingName, translated, eco, targetLang: targetLang || 'es' };
  }

  async syncCreateCategories(body: any, req: any): Promise<any> {
    const categories = body.categories || body;
    if (!Array.isArray(categories)) {
      throw new BadRequestException('Categories array is required');
    }

    const results = [];
    for (const cat of categories) {
      const existing = await this.categoryModel.findOne({ name: cat.name }).lean();
      if (existing) {
        results.push({ ...existing, existed: true });
      } else {
        const created = await this.categoryModel.create({
          ...cat,
          _id: cat._id || uuidv4(),
          createUuid: cat.createUuid || uuidv4(),
          createCreatedDate: new Date(),
        });
        results.push({ ...created.toObject(), existed: false });
      }
    }

    return { success: true, results };
  }

  async getByLineOfService(id: string, body: any): Promise<any> {
    // TODO: Migrate complex filtering logic from old CategoryService.getByLineOfService
    const categories = await this.categoryModel.find().lean();
    return { result: categories, count: categories.length };
  }

  async getByCategory(body: any): Promise<any> {
    // TODO: Migrate complex filtering logic from old CategoryService.filterByCategory2
    const categories = await this.categoryModel.find().lean();
    return { result: categories, count: categories.length };
  }
}
