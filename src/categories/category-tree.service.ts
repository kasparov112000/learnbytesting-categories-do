import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICategory, AiConfig } from './schemas/category.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoryTreeService {
  private readonly logger = new Logger(CategoryTreeService.name);

  constructor(@InjectModel('Categories') private readonly categoryModel: Model<ICategory>) {}

  /**
   * Find a category anywhere in the nested tree structure
   */
  findInTree(categories: any[], targetId: string): any | null {
    for (const category of categories) {
      if (String(category._id) === String(targetId)) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = this.findInTree(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Flatten a nested category tree into a flat array with breadcrumb paths
   */
  flattenNestedStructure(categories: any[], parentPath = ''): any[] {
    const result: any[] = [];

    for (const category of categories) {
      const breadcrumb = parentPath ? `${parentPath} > ${category.name}` : category.name;

      result.push({
        ...category,
        breadcrumb,
        depth: parentPath ? parentPath.split(' > ').length : 0,
      });

      if (category.children && category.children.length > 0) {
        result.push(...this.flattenNestedStructure(category.children, breadcrumb));
      }
    }

    return result;
  }

  /**
   * Build breadcrumb string for a category
   */
  buildBreadCrumb(category: any, parentPath = ''): string {
    return parentPath ? `${parentPath} > ${category.name}` : category.name;
  }

  /**
   * Filter out inactive children recursively
   */
  filterNonActiveChildren(category: any): any {
    if (!category) return category;

    const filtered = { ...category };
    if (Array.isArray(filtered.children)) {
      filtered.children = filtered.children
        .filter((child: any) => child && child.active !== false)
        .map((child: any) => this.filterNonActiveChildren(child));
    }

    return filtered;
  }

  /**
   * Merge existing category with new data, preserving immutable fields
   */
  getUpdatedCategory(existing: any, newData: any): any {
    const updated = { ...newData };

    // Preserve immutable fields from existing
    updated._id = existing._id;
    updated.createdDate = existing.createdDate;
    updated.createCreatedDate = existing.createCreatedDate;
    updated.createUuid = existing.createUuid || updated.createUuid;

    // Process children
    if (updated.children && existing.children) {
      updated.children = updated.children.map((newChild: any) => {
        const existingChild = existing.children.find(
          (ec: any) => ec.createUuid === newChild.createUuid,
        );

        if (existingChild) {
          const mergedChild = this.getUpdatedCategory(existingChild, newChild);
          mergedChild.parent = String(existing._id);
          return mergedChild;
        }

        // New child
        newChild._id = newChild._id || uuidv4();
        newChild.createdDate = new Date();
        newChild.createCreatedDate = newChild.createCreatedDate || new Date();
        newChild.parent = String(existing._id);
        return newChild;
      });
    }

    return updated;
  }

  /**
   * Create a new category in the nested structure
   */
  async createNewCategory(categoryData: any, req: any): Promise<any> {
    this.logger.log(`Creating nested category: ${categoryData.name} under parent: ${categoryData.parent}`);

    const newCategory: any = {
      ...categoryData,
      _id: categoryData._id || uuidv4(),
      createUuid: categoryData.createUuid || uuidv4(),
      createCreatedDate: new Date(),
      createdDate: new Date(),
      modifiedDate: new Date(),
      active: categoryData.active !== undefined ? categoryData.active : true,
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      children: categoryData.children || [],
    };

    if (req?.body?.currentUser?.info?.guid) {
      newCategory.createdByGuid = req.body.currentUser.info.guid;
      newCategory.modifiedByGuid = req.body.currentUser.info.guid;
    }

    // Find parent in tree and add child
    const allCategories = await this.categoryModel.find().lean();

    for (const root of allCategories) {
      const parent = this.findInTree([root], categoryData.parent);
      if (parent) {
        // Found parent — add child to parent's children array
        newCategory.parent = String(parent._id);

        // Update the root document with the new child added to the correct parent
        const updatedRoot = this.addChildToParent(root, String(parent._id), newCategory);
        await this.categoryModel.findByIdAndUpdate(root._id, updatedRoot);

        return newCategory;
      }
    }

    // Parent not found — create as root
    this.logger.warn(`Parent ${categoryData.parent} not found, creating as root`);
    const created = await this.categoryModel.create(newCategory);
    return created.toObject();
  }

  /**
   * Resolve AI config by walking up the tree and merging inherited configs
   */
  resolveAiConfig(allCategories: any[], category: any): AiConfig {
    const configChain: AiConfig[] = [];

    // Walk up the tree collecting configs
    let current = category;
    while (current) {
      if (current.aiConfig) {
        configChain.unshift(current.aiConfig);
      }
      if (current.parent) {
        current = this.findInTree(allCategories, current.parent);
      } else {
        break;
      }
    }

    // Merge configs (parent first, child overrides)
    let merged: AiConfig = {};
    for (const config of configChain) {
      merged = this.deepMergeAiConfig(merged, config);
    }

    return merged;
  }

  private deepMergeAiConfig(base: AiConfig, override: AiConfig): AiConfig {
    const result: any = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value) && base[key]) {
          result[key] = { ...base[key], ...value };
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  private addChildToParent(node: any, parentId: string, child: any): any {
    const updated = { ...node };

    if (String(updated._id) === parentId) {
      updated.children = [...(updated.children || []), child];
      return updated;
    }

    if (updated.children) {
      updated.children = updated.children.map((c: any) =>
        this.addChildToParent(c, parentId, child),
      );
    }

    return updated;
  }
}
