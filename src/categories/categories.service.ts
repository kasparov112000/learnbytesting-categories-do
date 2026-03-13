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
      ...(child.eco && { eco: child.eco }),
      ...(child.pgn && { pgn: child.pgn }),
      ...(child.tags?.length && { tags: child.tags }),
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

  // ─── Opening-specific methods (ported from Express category.service.ts) ───

  /**
   * Find the "Opening Theory & Repertoire" subtree.
   * It may be a root-level document OR a child of another category (e.g., "Chess").
   */
  private async findOpeningTheoryRoot(): Promise<any | null> {
    // Collect ALL "Opening Theory" nodes across the entire database.
    // The tree may be split across multiple top-level documents
    // (e.g., "Chess" has A-D and "Technology > Chess" has E).
    const mergedChildren: any[] = [];
    const seenNames = new Set<string>();

    // First: root-level documents matching "opening theory"
    const rootDocs = await this.categoryModel
      .find({ name: { $regex: /opening theory/i } })
      .lean();
    for (const doc of rootDocs) {
      for (const child of ((doc as any).children || []) as any[]) {
        if (child.name && !seenNames.has(child.name)) {
          seenNames.add(child.name);
          mergedChildren.push(child);
        }
      }
    }

    // Second: nested children matching "opening theory"
    const parentDocs = await this.categoryModel
      .find({ 'children.name': { $regex: /opening theory/i } })
      .lean();
    for (const parentDoc of parentDocs) {
      const matches = ((parentDoc as any).children || []).filter(
        (c: any) => /opening theory/i.test(c.name),
      );
      for (const match of matches) {
        for (const child of ((match as any).children || []) as any[]) {
          if (child.name && !seenNames.has(child.name)) {
            seenNames.add(child.name);
            mergedChildren.push(child);
          }
        }
      }
    }

    // Also check deeper nesting (e.g., Technology > Chess > Opening Theory)
    const deepParents = await this.categoryModel
      .find({ 'children.children.name': { $regex: /opening theory/i } })
      .lean();
    for (const doc of deepParents) {
      for (const child of ((doc as any).children || []) as any[]) {
        const matches = ((child as any).children || []).filter(
          (c: any) => /opening theory/i.test(c.name),
        );
        for (const match of matches) {
          for (const grandchild of ((match as any).children || []) as any[]) {
            if (grandchild.name && !seenNames.has(grandchild.name)) {
              seenNames.add(grandchild.name);
              mergedChildren.push(grandchild);
            }
          }
        }
      }
    }

    if (mergedChildren.length === 0) {
      return null;
    }

    // Return a synthetic merged root
    return { name: 'Opening Theory (merged)', children: mergedChildren };
  }

  async getOpeningCategories(): Promise<{ categories: any[] }> {
    const rootCategory = await this.findOpeningTheoryRoot();

    if (!rootCategory || !rootCategory.children?.length) {
      return { categories: [] };
    }

    const letterNames: Record<string, string> = {
      A: 'Flank Openings',
      B: 'Semi-Open Games',
      C: 'Open Games',
      D: 'Closed Games',
      E: 'Indian Defences',
    };

    // Aggregate by letter (merged root may have duplicate letter categories)
    const letterMap = new Map<string, { letter: string; name: string; count: number }>();

    for (const child of (rootCategory.children as any[])) {
      if (!/^[A-E]\b/i.test(child.name)) continue;
      const letter = child.name.charAt(0).toUpperCase();
      const count = this.countOpeningsWithPgn(child);
      const existing = letterMap.get(letter);
      if (existing) {
        existing.count += count;
      } else {
        letterMap.set(letter, {
          letter,
          name: letterNames[letter] || child.name,
          count,
        });
      }
    }

    const categories = [...letterMap.values()].sort((a, b) =>
      a.letter.localeCompare(b.letter),
    );

    return { categories };
  }

  async getOpeningsByLetter(
    letter: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ openings: any[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
    const upperLetter = letter?.toUpperCase();
    if (!upperLetter || !/^[A-E]$/.test(upperLetter)) {
      throw new BadRequestException('Letter must be A-E');
    }

    const rootCategory = await this.findOpeningTheoryRoot();

    if (!rootCategory) {
      return { openings: [], total: 0, page: page || 1, pageSize: pageSize || 0, hasMore: false };
    }

    // Flatten ALL openings with eco+pgn matching the requested letter
    // into a single list. The frontend renders each as a card in a grid.
    const openings: any[] = [];
    const seen = new Set<string>(); // dedupe by eco+name

    const collectOpenings = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.eco && node.pgn && node.eco.charAt(0).toUpperCase() === upperLetter) {
          const key = node.eco + '|' + node.name;
          if (!seen.has(key)) {
            seen.add(key);
            openings.push({
              eco: node.eco,
              name: node.name || '',
              pgn: node.pgn,
            });
          }
        }
        if (node.children && Array.isArray(node.children)) {
          collectOpenings(node.children);
        }
      }
    };

    // Walk all letter categories (E-prefix openings may be under D category)
    for (const letterCat of (rootCategory.children || []) as any[]) {
      collectOpenings(letterCat.children || []);
    }

    // Sort by ECO code then name
    const deduped = openings;
    deduped.sort((a, b) => a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name));

    // Paginate (when page/pageSize provided), otherwise return all
    const total = deduped.length;
    if (page && pageSize) {
      const start = (page - 1) * pageSize;
      const paged = deduped.slice(start, start + pageSize);
      const hasMore = page * pageSize < total;
      return { openings: paged, total, page, pageSize, hasMore };
    }
    return { openings: deduped, total, page: 1, pageSize: total, hasMore: false };
  }

  async searchOpenings(query: string, limit = 50): Promise<{ openings: any[] }> {
    if (!query) {
      return { openings: [] };
    }

    const rootCategory = await this.findOpeningTheoryRoot();

    if (!rootCategory) {
      return { openings: [] };
    }

    const results: any[] = [];
    const queryLower = query.toLowerCase();

    const searchChildren = (children: any[]) => {
      if (!children || !Array.isArray(children)) return;
      for (const child of children) {
        if (results.length >= limit) return;
        const nameMatch = child.name?.toLowerCase().includes(queryLower);
        const ecoMatch =
          child.eco?.toLowerCase() === queryLower ||
          child.eco?.toLowerCase().startsWith(queryLower);
        if ((nameMatch || ecoMatch) && child.pgn) {
          results.push({
            eco: child.eco || '',
            name: child.name || '',
            pgn: child.pgn || '',
            isVariation: !!(child.parent && child.eco && child.name?.includes(':')),
          });
        }
        searchChildren(child.children);
      }
    };

    for (const letterCat of (rootCategory.children || []) as any[]) {
      if (results.length >= limit) break;
      searchChildren(letterCat.children || []);
    }

    return { openings: results };
  }

  private countOpeningsWithPgn(category: any): number {
    let count = 0;
    if (category.pgn) count++;
    if (category.children && Array.isArray(category.children)) {
      for (const child of category.children) {
        count += this.countOpeningsWithPgn(child);
      }
    }
    return count;
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

  /**
   * Get all distinct tags across categories (including nested children).
   * When parentId is provided, only collect tags from that category's subtree.
   */
  async getDistinctTags(parentId?: string): Promise<{ result: string[] }> {
    const tagSet = new Set<string>();

    const collectTags = (categories: any[]) => {
      for (const cat of categories) {
        if (cat.tags && Array.isArray(cat.tags)) {
          cat.tags.forEach((tag: string) => tagSet.add(tag));
        }
        if (cat.children && Array.isArray(cat.children)) {
          collectTags(cat.children);
        }
      }
    };

    if (parentId) {
      const parent = await this.categoryModel.findById(this.coerceId(parentId)).lean();
      if (parent) {
        collectTags(parent.children || []);
      }
    } else {
      const allCategories = await this.categoryModel.find().lean();
      collectTags(allCategories);
    }

    return { result: Array.from(tagSet).sort() };
  }

  /**
   * Get all categories (including nested) matching a given tag.
   */
  /**
   * Find categories by their IDs anywhere in the tree.
   * Returns lightweight objects with _id, name, and breadcrumb path.
   */
  async findByIds(ids: string[]): Promise<{ result: { _id: string; name: string; breadcrumb: string; childrenCount: number }[] }> {
    if (!ids || ids.length === 0) {
      return { result: [] };
    }

    const idSet = new Set(ids.map(String));
    const found: { _id: string; name: string; breadcrumb: string; childrenCount: number }[] = [];

    const allRoots = await this.categoryModel.find().lean();

    const walk = (cats: any[], path: string[]) => {
      for (const cat of cats || []) {
        const catId = cat._id ? String(cat._id) : '';
        const currentPath = [...path, cat.name || ''];
        if (catId && idSet.has(catId)) {
          found.push({
            _id: catId,
            name: cat.name || '',
            breadcrumb: currentPath.join(' > '),
            childrenCount: Array.isArray(cat.children) ? cat.children.length : 0,
          });
        }
        if (cat.children?.length) {
          walk(cat.children, currentPath);
        }
      }
    };

    for (const root of allRoots) {
      const rootId = root._id ? String(root._id) : '';
      if (rootId && idSet.has(rootId)) {
        found.push({
          _id: rootId,
          name: root.name || '',
          breadcrumb: root.name || '',
          childrenCount: Array.isArray((root as any).children) ? (root as any).children.length : 0,
        });
      }
      if ((root as any).children?.length) {
        walk((root as any).children, [root.name || '']);
      }
    }

    return { result: found };
  }

  async getByTag(tag: string): Promise<{ result: any[]; count: number }> {
    const allCategories = await this.categoryModel.find().lean();
    const matched: any[] = [];

    const searchByTag = (categories: any[]) => {
      for (const cat of categories) {
        if (cat.tags && Array.isArray(cat.tags) && cat.tags.includes(tag)) {
          matched.push({
            _id: cat._id,
            name: cat.name,
            eco: cat.eco,
            tags: cat.tags,
            childrenCount: Array.isArray(cat.children) ? cat.children.length : 0,
            isActive: cat.isActive,
          });
        }
        if (cat.children && Array.isArray(cat.children)) {
          searchByTag(cat.children);
        }
      }
    };

    searchByTag(allCategories);
    return { result: matched, count: matched.length };
  }

  /**
   * Update tags for a category at any nesting level.
   */
  async updateTags(id: string, tags: string[]): Promise<any> {
    const allCategories = await this.categoryModel.find().lean();

    // Try root-level first
    const rootCategory = allCategories.find((c: any) => c._id?.toString() === id);
    if (rootCategory) {
      const updated = await this.categoryModel.findByIdAndUpdate(
        this.coerceId(id),
        { $set: { tags } },
        { new: true },
      ).lean();
      return { result: updated };
    }

    // Search in nested children
    for (const root of allCategories) {
      const updateInChildren = (children: any[]): boolean => {
        if (!children || !Array.isArray(children)) return false;
        for (const child of children) {
          if (child._id?.toString() === id) {
            child.tags = tags;
            return true;
          }
          if (child.children && updateInChildren(child.children)) return true;
        }
        return false;
      };

      if (updateInChildren(root.children || [])) {
        await this.categoryModel.findByIdAndUpdate(
          root._id,
          { $set: { children: root.children } },
          { new: true },
        );
        return { result: { _id: id, tags } };
      }
    }

    throw new NotFoundException(`Category with ID ${id} not found`);
  }
}
