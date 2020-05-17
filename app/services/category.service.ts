import { DbMicroServiceBase } from '@mdr/framework';
import { Category, MdrApplicationUser } from '@mdr/models';
import { ObjectID } from 'mongodb';
import {logger} from '@easydevops/pwc-us-agc-logger';

export class CategoryService extends DbMicroServiceBase { // eslint-disable-line
  constructor(dbService) {
    super(dbService);
  }

  public async getByLineOfService(req, res) {
    await this.filterLinesOfService(req);
    super.get(req, res);
  }

  public async syncCreateCategories(req, res) {
    const createCategories: Array<Category> = req.body.categories;
    const linesOfService: Array<Category> = await this.dbService.find(req);
    for (let createCategory of createCategories) {
      let lineOfServiceIndex = linesOfService.findIndex(category => category.createUuid === createCategory.createUuid);

      if (lineOfServiceIndex !== -1) {
        logger.info("Updating category: "+createCategory.name);
        let lineOfService = linesOfService[lineOfServiceIndex];
        lineOfService = this.getUpdatedCategory(lineOfService, createCategory);
        await this.updateCategory(lineOfService)
        linesOfService.splice(lineOfServiceIndex, 1);
      } else {
        logger.info("Creating new category: "+createCategory.name);
        const newCategory = new Category();
        newCategory.createUuid = createCategory.createUuid;
        await this.dbService.create(this.getUpdatedCategory(newCategory, createCategory));
      }

    }

    for (let lineOfService of linesOfService) {
      lineOfService.active = false;
      await this.updateCategory(lineOfService);
    }

    return this.handleResponse(await this.dbService.find({ query: {}, params: {} }), res);
  }

  public getUpdatedCategory(category: Category, createCategory: Category): Category {
    const updatedCategory = Object.assign(new Category(), category);
    const missingChildren = Object.assign(new Array<Category>(), category.children);

    updatedCategory._id = updatedCategory._id || (new ObjectID()).toHexString();
    updatedCategory.createdDate = updatedCategory.createdDate || new Date();
    updatedCategory.name = createCategory.name;
    updatedCategory.createCreatedDate = createCategory.createCreatedDate;
    updatedCategory.active = createCategory.active;

    for (let createSubCategory of createCategory.children) {
      let subCategoryIndex = category.children.findIndex(child => child.createUuid === createSubCategory.createUuid);

      if (subCategoryIndex !== -1) {
        let subCategory = this.getUpdatedCategory(category.children[subCategoryIndex], createSubCategory);
        subCategory.modifiedDate = new Date();
        category.children[subCategoryIndex] = subCategory;
        missingChildren.splice(missingChildren.findIndex(c => c.createUuid === subCategory.createUuid), 1);
      } else {
        const newCategory = new Category();
        newCategory.parent = updatedCategory._id;
        newCategory.createUuid = createSubCategory.createUuid;
        updatedCategory.children.push(this.getUpdatedCategory(newCategory, createSubCategory));
      }
    }

    for (let child of missingChildren) {
      child.active = false;
    }

    return updatedCategory;
  }

  private async updateCategory(lineOfService: Category) {
    lineOfService.modifiedDate = new Date();
    await this.dbService.update({
      params: {
        id: lineOfService._id
      },
      body: lineOfService
    });
  }

  private async filterLinesOfService(req) {
    const includeAll = !!req.query.includeAll;

    const currentUser: MdrApplicationUser = req.body.currentUser as MdrApplicationUser;
    const countCategories: number = currentUser.categories.length;
   
    if (includeAll || (countCategories === 0 && !currentUser['active'] )) {
      delete req.query.includeAll;
      return;
    }
    req.params['_id'] = { '$in': currentUser.categories.map(lineOfService => lineOfService._id) };
  }
}
