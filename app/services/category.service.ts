import { DbMicroServiceBase } from './db-micro-service-base';
import { Category, MdrApplicationUser } from 'hipolito-models';
import { ObjectID, ObjectId } from 'mongodb';


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
        console.log("Updating category: "+createCategory.name);
        let lineOfService = linesOfService[lineOfServiceIndex];
        lineOfService = this.getUpdatedCategory(lineOfService, createCategory);
        await this.updateCategory(lineOfService)
        linesOfService.splice(lineOfServiceIndex, 1);
      } else {
        console.log("Creating new category: "+createCategory.name);
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
    console.log('includeAll should be false', includeAll);
    const currentUser: MdrApplicationUser = req.body.currentUser as MdrApplicationUser;
    console.log('currentUser should have data', currentUser)
    const countCategories: number = currentUser?.categories?.length || 0;
    console.log('countCategories should be 0', countCategories);
   
    if (includeAll || (( currentUser && !currentUser['isActive']) )) {
      delete req.query.includeAll;
      return;
    }
    const idArr = currentUser.categories.map(lineOfService => {
      const o_id = new ObjectId(lineOfService._id);
      return o_id;
    });
    req.params['_id'] = { '$in':idArr };

  }
}
