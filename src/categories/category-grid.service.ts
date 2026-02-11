import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICategory } from './schemas/category.schema';
import { CategoryTreeService } from './category-tree.service';

@Injectable()
export class CategoryGridService {
  private readonly logger = new Logger(CategoryGridService.name);

  constructor(
    @InjectModel('Categories') private readonly categoryModel: Model<ICategory>,
    private readonly treeService: CategoryTreeService,
  ) {}

  async grid(params: any, req: any): Promise<any> {
    this.logger.log('Grid request received');

    const startRow = params.startRow || 0;
    const endRow = params.endRow || 100;
    const sortModel = params.sortModel || [];
    const filterModel = params.filterModel || {};

    // Get all categories and flatten
    const categories = await this.categoryModel.find().lean();
    let flattened = this.treeService.flattenNestedStructure(categories);

    // Apply filters
    flattened = this.applyFilters(flattened, filterModel);

    // Apply sorting
    if (sortModel.length > 0) {
      flattened = this.sortData(flattened, sortModel);
    }

    const totalCount = flattened.length;
    const rows = flattened.slice(startRow, endRow);

    return { rows, lastRow: totalCount };
  }

  async gridFlatten(params: any, req: any): Promise<any> {
    const startTime = Date.now();
    this.logger.log('Grid flatten request received');

    const startRow = params.startRow || 0;
    const endRow = params.endRow || 100;
    const sortModel = params.sortModel || [];
    const filterModel = params.filterModel || {};

    // Get all categories
    const dbStart = Date.now();
    const categories = await this.categoryModel.find().lean();
    const dbTime = Date.now() - dbStart;

    // Flatten
    const flattenStart = Date.now();
    let flattened = this.treeService.flattenNestedStructure(categories);
    const flattenTime = Date.now() - flattenStart;

    // Filter
    const filterStart = Date.now();
    flattened = this.applyFilters(flattened, filterModel);
    const filterTime = Date.now() - filterStart;

    // Sort
    const sortStart = Date.now();
    if (sortModel.length > 0) {
      flattened = this.sortData(flattened, sortModel);
    }
    const sortTime = Date.now() - sortStart;

    const totalCount = flattened.length;
    const rows = flattened.slice(startRow, endRow);
    const totalTime = Date.now() - startTime;

    this.logger.log(`Grid flatten: db=${dbTime}ms, flatten=${flattenTime}ms, filter=${filterTime}ms, sort=${sortTime}ms, total=${totalTime}ms`);

    return { rows, lastRow: totalCount };
  }

  async search(term: string): Promise<any> {
    if (!term || term.length < 2) {
      return { result: [], count: 0 };
    }

    const categories = await this.categoryModel.find().lean();
    const flattened = this.treeService.flattenNestedStructure(categories);

    const regex = new RegExp(term, 'i');
    const matches = flattened.filter((cat: any) => regex.test(cat.name));

    return { result: matches, count: matches.length };
  }

  sortData(data: any[], sortModel: any[]): any[] {
    if (!sortModel || sortModel.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const sort of sortModel) {
        const field = sort.colId || sort.field;
        const direction = sort.sort === 'desc' ? -1 : 1;

        const valA = a[field];
        const valB = b[field];

        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
      }
      return 0;
    });
  }

  private applyFilters(data: any[], filterModel: any): any[] {
    if (!filterModel || Object.keys(filterModel).length === 0) return data;

    return data.filter((item) => {
      for (const [field, filter] of Object.entries(filterModel) as any) {
        const value = item[field];

        if (filter.filterType === 'text') {
          if (!this.matchTextFilter(value, filter)) return false;
        } else if (filter.filterType === 'number') {
          if (!this.matchNumberFilter(value, filter)) return false;
        } else if (filter.filterType === 'set') {
          if (!this.matchSetFilter(value, filter)) return false;
        }
      }
      return true;
    });
  }

  private matchTextFilter(value: any, filter: any): boolean {
    const filterValue = String(filter.filter || '').toLowerCase();
    const fieldValue = String(value || '').toLowerCase();

    switch (filter.type) {
      case 'contains': return fieldValue.includes(filterValue);
      case 'notContains': return !fieldValue.includes(filterValue);
      case 'equals': return fieldValue === filterValue;
      case 'notEqual': return fieldValue !== filterValue;
      case 'startsWith': return fieldValue.startsWith(filterValue);
      case 'endsWith': return fieldValue.endsWith(filterValue);
      default: return true;
    }
  }

  private matchNumberFilter(value: any, filter: any): boolean {
    const numValue = Number(value);
    const filterNum = Number(filter.filter);

    switch (filter.type) {
      case 'equals': return numValue === filterNum;
      case 'notEqual': return numValue !== filterNum;
      case 'greaterThan': return numValue > filterNum;
      case 'greaterThanOrEqual': return numValue >= filterNum;
      case 'lessThan': return numValue < filterNum;
      case 'lessThanOrEqual': return numValue <= filterNum;
      case 'inRange': return numValue >= filterNum && numValue <= Number(filter.filterTo);
      default: return true;
    }
  }

  private matchSetFilter(value: any, filter: any): boolean {
    if (!filter.values || filter.values.length === 0) return true;
    return filter.values.includes(String(value));
  }
}
