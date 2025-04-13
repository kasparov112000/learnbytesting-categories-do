import { DbMicroServiceBase } from "./db-micro-service-base";
import { Category, MdrApplicationUser } from "hipolito-models";
import { ObjectID, ObjectId } from "mongodb";
import { has, isEmpty, isEqual, trim } from "lodash";
import { IServerSideGetRowsRequest } from "ag-grid-community";
import { MongoDBUtilities } from "../utils/utilities";
import * as moment from "moment";
import { GridFilterSearchHelper } from "../helpers/gridFilterSearchHelper";

type GridServerSideRowRequest = Partial<IServerSideGetRowsRequest> & {
  search: { search: string; inflightStart: Date; inflightEnd: Date };
};

export class CategoryService extends DbMicroServiceBase {
  constructor(dbService) {
    super(dbService);
  }

  public async getByLineOfService(req, res) {
    return await this.filterLinesOfService(req, res);
  }

  public async getByCategory(req, res) {
    let resp;
    resp = await this.filterByCategory(req, res);
    return resp;
  }


  public async grid(
    params: GridServerSideRowRequest,
    res,
    txnId
  ): Promise<any> {
    // public async grid(params: GridServerSideRowRequest, permissions: Array<Permissions>, user: User, txnId): Promise<any> {
    console.log("the params 250", params);
    const start = parseInt(params?.startRow?.toString() || "", 10);
    let sort = this.getSortOrder(params);
    let inflightFilter = null;
    if (
      params?.sortModel &&
      params.sortModel[0] &&
      params.sortModel[0].colId === "isInflight"
    ) {
      sort = { isInflight: params.sortModel[0].sort === "asc" ? 1 : -1 };
    }
    if (params?.search?.inflightStart) {
      params.search.inflightStart = new Date();
    } else {
      // params.search.inflightStart = moment(params.search.inflightStart).toDate();
    }
    // if (!params.search.inflightEnd) {
    //     params.search.inflightEnd = new Date();
    // } else {
    //     params.search.inflightEnd = moment(params.search.inflightEnd).toDate();
    // }
    if (params.filterModel && has(params.filterModel, "isInflight.values")) {
      if (isEqual(params.filterModel.isInflight.values, ["true"])) {
        inflightFilter = { isInflight: true };
      } else {
        inflightFilter = { isInflight: false };
      }
      delete params.filterModel.isInflight;
    }
    const query = this.getGridFilter(params, "permissions", true); //'user') //, 'txnId', false);
    // const query = this.getGridFilter(params, txnId, false);

    const aggregate: any = [
      {
        $match: query,
      },
      // {
      //     $addFields: {
      //         isInflight: {
      //             $cond: {
      //                 if: {
      //                     $or: [
      //                         {
      //                             $and: [
      //                                 { $gt: ['$firstContactDate', null] },
      //                                 { $gt: ['$hardCloseDate', null] },
      //                                 { $lte: ['$firstContactDate', params.search.inflightEnd] },
      //                                 { $gte: ['$hardCloseDate', params.search.inflightStart] },
      //                             ],
      //                         },
      //                         {
      //                             $and: [
      //                                 { $lt: ['$hardCloseDate', new Date(0)] },
      //                                 { $gt: ['$firstContactDate', null] },
      //                                 { $lte: ['$firstContactDate', params.search.inflightEnd] },
      //                             ],
      //                         },
      //                         {
      //                             $and: [{ $lt: ['$firstContactDate', new Date(0)] }, { $lt: ['$hardCloseDate', new Date(0)] }],
      //                         },
      //                     ],
      //                 },
      //                 then: true,
      //                 else: false,
      //             },
      //         },
      //     },
      // },
    ];
    // if (inflightFilter) {
    //     aggregate.push({ $match: inflightFilter });
    // }
    if (!isEmpty(sort)) {
      aggregate.push({ $sort: sort });
    }
    aggregate.push(
      {
        $group: {
          _id: null,
          rows: { $push: "$$ROOT" },
          lastRow: { $sum: 1 },
        },
      },
      {
        $project: {
          lastRow: 1,
          rows: {
            $slice: ["$rows", start, params.endRow - params.startRow],
            //  $slice: ['$rows', 0, 77772 - 1],
          },
        },
      }
    );

    let results = await this.dbService.grid(aggregate); // this.model.aggregate(aggregate).allowDiskUse(true).collation({ locale: 'en_US', numericOrdering: true });
    const response = results[0] || { rows: [], lastRow: 0 };
    // if(response.rows.length > 0){
    //   const categories = await CategoriesHelper.getCategories();
    //   response.rows = CategoriesHelper.mapCategories(response.rows, categories?.result);
    // }
    return res.status(200).json(response);
  }

  public async gridFlatten(
    params: GridServerSideRowRequest,
    userInfo,
    res,
    txnId
): Promise<any> {
    let results = await this.filterByCategory2(userInfo, res);
    console.log('1. Initial results:', {
        hasResults: !!results?.length,
        firstResult: results?.[0]
    });
    
    if (!results?.length) {
        return res.status(200).json({ 
            rows: [], 
            lastRow: 0, 
            categories: {}, 
            mainCategory: {}, 
            category: {} 
        });
    }

    const mainCategory = { ...results[0], children: [] };
    const category = results[0].children ? {
        ...results[0].children,
        count: results[0].children.length,
    } : { count: 0, children: [] };

    const categories = results[0].children || {};

    console.log('5. Before mapping children:', {
        hasNestedChildren: !!results[0].children?.children,
        nestedChildrenCount: results[0].children?.children?.length,
        nestedChildren: results[0].children?.children
    });

    // Modified this part to properly handle the breadcrumb
    results = results[0].children?.children?.map(
        (category) => ({
            ...category,
            breadcrumb: `Chess > ${category.name}`,  // Using parent category name
            parent: results[0].children.name  // Store parent name
        })
    ) || [];

    console.log('6. After mapping children:', {
        resultsLength: results.length,
        mappedResults: results
    });

    // Replace the flattenNestedStructure call with direct array
    let allCategories = results;  // Since we don't need to flatten further
    console.log('7. Categories structure:', {
        categoriesLength: allCategories.length,
        categories: allCategories
    });

    let categoriesResult = allCategories;

    if (params) {
        console.log('8. Grid params:', {
            filterModel: params.filterModel,
            startRow: params.startRow,
            endRow: params.endRow
        });

        categoriesResult = GridFilterSearchHelper.handleSearchFilter(
            params.filterModel,
            allCategories
        )[0];
        console.log('9. After search filter:', {
            resultLength: categoriesResult.length,
            filteredResults: categoriesResult
        });

        categoriesResult = this.sortCategories(params, categoriesResult);
        console.log('10. After sorting:', {
            resultLength: categoriesResult.length
        });
    }

    const start = parseInt(params?.startRow?.toString() || "", 10);
    const end = parseInt(params?.endRow?.toString() || "", 10);

    const slicedCategories = this.sliceArray(categoriesResult, start, end);
    console.log('12. Final sliced categories:', {
        slicedLength: slicedCategories.length,
        slicedData: slicedCategories
    });

    return res.status(200).json({ 
        rows: slicedCategories, 
        lastRow: categoriesResult.length, 
        categories, 
        mainCategory, 
        category 
    });
}

// Helper method to check if a category has any nested items
private hasNestedItems(category: any): boolean {
    return category && 
           Array.isArray(category.children) && 
           category.children.length > 0;
}

  public async search(req, res) {
    let results = await this.dbService.findAll();
    results = results.map((category) => this.buildBreadCrumb(category));
    let allCategories = this.flattenNestedStructure(results);

    const searchText = req.body.search;

    const response = allCategories.filter((category) => {
      return category.name.toLowerCase().includes(searchText.toLowerCase());
    });

    return res.status(200).json(response);
  }

  public sliceArray(items: [], start: number, end: number) {
    const result = items.slice(start, end);
    return result;
  }

  private sortCategories(params, arr) {
    if (params.sortModel && params.sortModel?.length === 0) return arr;

    const { colId, sort } = params.sortModel[0];
    return arr.sort((a, b) => {
      if (a[colId] < b[colId]) {
        return sort === "asc" ? -1 : 1;
      }
      if (a[colId] > b[colId]) {
        return sort === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  private getSortOrder(
    params: GridServerSideRowRequest
  ): Record<string, number> {
    const shouldSort = params.sortModel?.length > 0;

    if (!shouldSort) {
      return { addedDate: -1 };
    }

    const { colId, sort } = params.sortModel[0];
    let key;
    switch (colId) {
      case "client":
      case "tags":
      case "category":
        key = `${colId}.name`;
        break;
      case "exam":
        key = `${colId}.name`;
        break;
      case "submitter":
      case "projectManager":
      case "riskManagementPartner":
      case "attorney1":
      case "attorney2":
        key = `${colId}.preferredFormattedName`;
        break;
      default:
        key = colId;
        break;
    }
    return { [key]: sort === "desc" ? -1 : 1 };
  }

  public async syncCreateCategories(req, res) {
    try {
        console.log("Starting syncCreateCategories with body:", JSON.stringify(req.body, null, 2));
        
        const createCategory = req.body.categories;
        if (!createCategory) {
            throw new Error("No category data provided");
        }

        console.log("Processing category:", JSON.stringify(createCategory, null, 2));

        // Find existing category
        const existingCategories = await this.dbService.find({
            query: { _id: createCategory._id }
        });

        let result;
        if (existingCategories && existingCategories.length > 0) {
            const existingCategory = existingCategories[0];
            console.log("Found existing category:", existingCategory.name);
            
            // Ensure children array exists
            if (!Array.isArray(existingCategory.children)) {
                existingCategory.children = [];
            }
            
            result = await this.updateExistingCategory(existingCategory, createCategory);
        } else {
            console.log("Creating new category:", createCategory.name);
            result = await this.createNewCategory(createCategory);
        }

        const updatedCategories = await this.dbService.find({ query: {}, params: {} });
        return this.handleResponse(updatedCategories, res);
    } catch (error) {
        console.error("Error in syncCreateCategories:", error);
        return res.status(500).json({ error: "Failed to sync categories" });
    }
  }

  private async updateExistingCategory(existingCategory: Category, createCategory: Category): Promise<Category> {
    console.log("Updating category:", existingCategory.name);
    
    // Create a new category instance with existing data
    const updatedCategory = new Category();
    Object.assign(updatedCategory, existingCategory);

    // Update basic properties
    updatedCategory.name = createCategory.name;
    updatedCategory.active = createCategory.active ?? true;
    updatedCategory.modifiedDate = new Date();

    // Ensure children array exists
    updatedCategory.children = Array.isArray(updatedCategory.children) ? updatedCategory.children : [];

    // Process children if they exist
    if (createCategory.children && Array.isArray(createCategory.children)) {
        const processedChildren = [];
        
        for (const childData of createCategory.children) {
            if (!childData) continue;

            // Find existing child
            const existingChild = updatedCategory.children.find(child => 
                child && (child._id === childData._id || child.createUuid === childData.createUuid)
            );

            if (existingChild) {
                const updatedChild = await this.updateExistingCategory(existingChild, childData);
                processedChildren.push(updatedChild);
            } else {
                const newChild = await this.createNewCategory(childData);
                newChild.parent = updatedCategory._id;
                processedChildren.push(newChild);
            }
        }

        updatedCategory.children = processedChildren;
    }

    // Update in database
    await this.dbService.update({
        params: { _id: updatedCategory._id },
        body: updatedCategory
    });

    return updatedCategory;
  }

  private async createNewCategory(categoryData: Category): Promise<Category> {
    console.log("Creating new category:", categoryData.name);
    
    const newCategory = new Category();
    
    // Set basic properties
    newCategory._id = categoryData._id || new ObjectID().toHexString();
    newCategory.name = categoryData.name;
    newCategory.active = categoryData.active ?? true;
    newCategory.createUuid = categoryData.createUuid;
    newCategory.parent = categoryData.parent;
    newCategory.createdDate = new Date();
    newCategory.createCreatedDate = categoryData.createCreatedDate || new Date();
    newCategory.modifiedDate = new Date();
    newCategory.children = [];

    // Process children if they exist
    if (categoryData.children && Array.isArray(categoryData.children)) {
        const processedChildren = [];
        
        for (const childData of categoryData.children) {
            if (!childData) continue;
            
            const childCategory = await this.createNewCategory(childData);
            childCategory.parent = newCategory._id;
            processedChildren.push(childCategory);
        }

        newCategory.children = processedChildren;
    }

    // Create in database
    await this.dbService.create(newCategory);

    return newCategory;
  }

  // Helper method to find a category by ID
  private async findCategoryById(categoryId: string): Promise<Category | null> {
    try {
        const result = await this.dbService.find({
            params: { _id: categoryId }
        });
        return result[0] || null;
    } catch (error) {
        console.error('Error finding category by ID:', error);
        return null;
    }
  }

  private async updateCategory(lineOfService: Category) {
    lineOfService.modifiedDate = new Date();
    await this.dbService.update({
      params: {
        id: lineOfService._id,
        name: lineOfService.name,
      },
      body: lineOfService,
    });
  }

  private async filterLinesOfService(req, res) {
    // const userData = await getUserDataHelper.getUserData(req.body.currentUser._id);
    const currentUser: any = req.body.currentUser as MdrApplicationUser;
    const getAllCategories: any = req.body.getAllCategories;
    const isAdmin =
      currentUser?.roles?.filter(
        (role) => role?.name === "System Administrator"
      ).length > 0;
    console.log("currentUser should have data", currentUser);
    const countCategories: number = currentUser?.linesOfService?.length || 0;
    console.log("countCategories should be 0", countCategories);

    if (isAdmin || getAllCategories)
      return super.getNested(null, res, isAdmin, getAllCategories);

    const idArr = currentUser?.linesOfService?.map((lineOfService) => {
      const o_id = new ObjectId(lineOfService._id);
      return o_id;
    });
    req.params["_id"] = { $in: idArr };
    req.params["active"] = true;

    return super.getNested(idArr, res, isAdmin, getAllCategories);
  }

  
  private async filterByCategory(req, res) {
    const userInfo = req?.body?.userInfo?.result || req?.body?.session?.user?.userInfo?.result;
    const currentUser: any = req.body.currentUser || userInfo;
    const getAllCategories: any = req.body.includeAll;
    
    // Safely get mainCategory and category with fallback to empty objects
    const mainCategory = userInfo?.mainCategory?.[0] ? { ...userInfo.mainCategory[0], children: [] } : { name: '', children: [] };
    const category = userInfo?.category?.[0] ? { ...userInfo.category[0], children: [] } : { name: '', children: [] };

    const isAdmin = currentUser?.roles?.filter(
        (role) => role?.name === "System Administrator"
    ).length > 0 || currentUser['https://learnbytesting_ai/roles']?.includes("Admin");

    console.log("Debug - User Info:", {
        userInfo,
        currentUser,
        isAdmin,
        getAllCategories,
        mainCategory,
        category
    });

    if (isAdmin || getAllCategories) {
        console.log("Debug - Admin or getAllCategories is true, getting all categories");
        let resp = await super.getSubCategory(null, null, res, isAdmin, getAllCategories);
        return resp;
    }

    // Only proceed with category filtering if we have valid category names
    if (!mainCategory.name || !category.name) {
        return this.handlePagedResponse({ 
            result: [{ _id: null, name: '', children: [] }], 
            count: 0 
        }, res);
    }

    console.log("Debug - Getting filtered categories");
    let filteredResp = await super.getSubCategory(mainCategory.name, category.name, res, isAdmin, getAllCategories);
    return filteredResp;
  }

  private async  filterByCategory2(userInfo, res) {
    // const userData = await getUserDataHelper.getUserData(req.body.currentUser._id);
   
    // const userInfo = req?.body?.userInfo?.result || req?.body?.session?.user?.userInfo?.result;
    // const currentUser: any = req.body.currentUser || userInfo;
    //const getAllCategories: any = req.body.getAllCategories;
    const mainCategory = { ...userInfo.mainCategory[0], children: [] };
    const category = {...userInfo.category[0], children: []};

    const isAdmin = true;
      // currentUser?.roles?.filter(
      //   (role) => role?.name === "System Administrator"
      // ).length > 0 || currentUser['https://learnbytesting_ai/roles'].includes("Admin");
    // console.log("currentUser should have data", currentUser);
    const countCategories: number = 0; // currentUser?.linesOfService?.length || 0;
 

    if (isAdmin) {
      let resp = await super.getSubCategory2(mainCategory.name, category.name, res, isAdmin, category._id);
    return resp;
    }

    // const idArr = currentUser?.linesOfService?.map((lineOfService) => {
    //   const o_id = new ObjectId(lineOfService._id);
    //   return o_id;
   //  });
    //req.params["_id"] = { $in: idArr };
    // req.params["active"] = true;

    return super.getSubCategory2(mainCategory.name, category.name, res, isAdmin, category.id);
  }

  private getGridFilter(
    params: GridServerSideRowRequest,
    txnId,
    isFlatQuery: boolean
  ): Record<string, string> {
    // private getGridFilter(params: GridServerSideRowRequest, permissions: Array<Permissions>, user: User, txnId, isFlatQuery: boolean): Record<string, string> {

    let query: any = {};
    const queries = [];
    // if (!permissions || (!permissions.includes(Permissions.CanViewOwnDeals) && !permissions.includes(Permissions.CanViewOtherDeals))) {
    //     throw new UnauthorizedError('Missing permissions to view deals');
    // }

    // if (!isFlatQuery && permissions.includes(Permissions.CanViewOwnDeals) && !permissions.includes(Permissions.CanViewOtherDeals)) {
    //     queries.push({
    //         $or: [
    //             { 'initialContactName.guid': user.guid },
    //             { 'dealAdvisor1.guid': user.guid },
    //             { 'dealAdvisor2.guid': user.guid },
    //             { 'pricingSupport.guid': user.guid },
    //         ],
    //     });
    // }

    if (!isFlatQuery && params && params.search?.search) {
      query.$text = {
        $search: `"${trim(params.search?.search)?.replace('"', '\\"')}"`,
      };
    }

    if (!params?.filterModel) {
      return queries.length > 0 ? { ...query, $and: queries } : query;
    }

    const entries: Array<Array<any>> = Object.entries(params.filterModel);
    for (const entry of entries) {
      const key = entry[0];
      const value = entry[1];
      const operator =
        value.operator === "AND"
          ? "$and"
          : value.operator === "OR"
          ? "$or"
          : undefined;
      let fieldKey = this.convertFieldToKey(key);

      if (isFlatQuery) {
        fieldKey = this.convertFieldToFlatKey(key);
      }
      let filter;
      switch (value.filterType) {
        case "number": {
          if (operator) {
            filter = {
              [operator]: [
                {
                  [fieldKey]: this.getNumberFilter(
                    fieldKey,
                    value.condition1,
                    txnId
                  ),
                },
                {
                  [fieldKey]: this.getNumberFilter(
                    fieldKey,
                    value.condition2,
                    txnId
                  ),
                },
              ],
            };
          } else {
            filter = {
              [fieldKey]: this.getNumberFilter(fieldKey, value, txnId),
            };
          }
          break;
        }
        case "text": {
          if (operator) {
            filter = {
              [operator]: [
                {
                  [fieldKey]: this.getTextFilter(
                    fieldKey,
                    value.condition1,
                    txnId
                  ),
                },
                {
                  [fieldKey]: this.getTextFilter(
                    fieldKey,
                    value.condition2,
                    txnId
                  ),
                },
              ],
            };
          } else {
            filter = { [fieldKey]: this.getTextFilter(fieldKey, value, txnId) };
          }
          break;
        }
        case "date": {
          if (operator) {
            filter = {
              [operator]: [
                {
                  [fieldKey]: this.getDateFilter(
                    fieldKey,
                    value.condition1,
                    txnId
                  ),
                },
                {
                  [fieldKey]: this.getDateFilter(
                    fieldKey,
                    value.condition2,
                    txnId
                  ),
                },
              ],
            };
          } else {
            filter = { [fieldKey]: this.getDateFilter(fieldKey, value, txnId) };
          }
          break;
        }
        case "set": {
          filter = { [fieldKey]: this.getSetFilter(fieldKey, value) };
          break;
        }
        default: {
          console.error(
            `There was an error filtering grid data: ${value.filterType}`,
            {
              body: {
                txnId,
                message: "Unknown filter type",
                timestamp: Date.now(),
              },
            }
          );
          break;
        }
      }

      if (filter) {
        queries.push(filter);
      }
    }
    if (queries.length === 1) query = queries.shift();

    return queries.length > 0 ? { ...query, $and: queries } : query;
  }

  private getNumberFilter(key, item, txnId): any {
    switch (item.type) {
      case "equals":
        return { $eq: item.filter };
      case "notEqual":
        return { $ne: item.filter };
      case "greaterThan":
        return { $gt: item.filter };
      case "greaterThanOrEqual":
        return { $gte: item.filter };
      case "lessThan":
        return { $lt: item.filter };
      case "lessThanOrEqual":
        return { $lte: item.filter };
      case "inRange":
        return { $lte: item.filter, $gte: item.filterTo };
      default:
        console.error(
          `There was an error filtering the numbers: ${item.type}`,
          {
            body: {
              txnId,
              message: "Unknown filter type",
              timestamp: Date.now(),
            },
          }
        );
        return;
    }
  }

  private getTextFilter(key, item, txnId): any {
    switch (item.type) {
      case "equals":
        return { $eq: item.filter };
      case "notEqual":
        return { $ne: item.filter };
      case "contains":
        return { $regex: MongoDBUtilities.escapeRegex(item.filter) };
      case "notContains":
        return { $not: { $regex: MongoDBUtilities.escapeRegex(item.filter) } };
      case "startsWith":
        return { $regex: `^${MongoDBUtilities.escapeRegex(item.filter)}` };
      case "endsWith":
        return { $regex: `${MongoDBUtilities.escapeRegex(item.filter)}$` };
      default:
        console.error(
          `There was an error filtering the text range filter: ${item.type}`,
          {
            body: {
              txnId,
              message: "Unknown filter type",
              timestamp: Date.now(),
            },
          }
        );
        return;
    }
  }

  private getDateFilter(key, item, txnId): any {
    const date = moment.utc(item.dateFrom).format("YYYY-MM-DD HH:mm:ss");
    switch (item.type) {
      case "equals":
        return {
          $lte: new Date(moment.utc(date).endOf("day").toISOString()),
          $gte: new Date(moment.utc(date).startOf("day").toISOString()),
        };
      case "notEqual":
        return {
          $not: {
            $lte: new Date(moment.utc(date).endOf("day").toISOString()),
            $gte: new Date(moment.utc(date).startOf("day").toISOString()),
          },
        };
      case "greaterThan":
        return { $gte: new Date(moment.utc(date).endOf("day").toISOString()) };
      case "greaterThanOrEqual":
        return {
          $gte: new Date(moment.utc(date).startOf("day").toISOString()),
        };
      case "lessThan":
        return { $lt: new Date(moment.utc(date).startOf("day").toISOString()) };
      case "lessThanOrEqual":
        return { $lte: new Date(moment.utc(date).endOf("day").toISOString()) };
      case "inRange": {
        const utcDateTo = moment.utc(item.dateTo).toDate();
        return {
          $lte: new Date(moment.utc(utcDateTo).endOf("day").toISOString()),
          $gte: new Date(moment.utc(date).startOf("day").toISOString()),
        };
      }
      default:
        console.error(
          `There was an error filtering the date range: ${item.type}`,
          {
            body: {
              txnId,
              message: "Unknown filter type",
              timestamp: Date.now(),
            },
          }
        );
        return;
    }
  }

  private getSetFilter(key, item): any {
    const values = item?.values || [];
    return {
      $in: values.map((value) =>
        value === "true" || value === "false"
          ? value === "true"
            ? true
            : false
          : (key === "calculatedValue" ||
              key === "closedDealCalculatedValue" ||
              key === "closedDeals.calculatedValue") &&
            value
          ? parseInt(value)
          : value
      ),
    };
  }

  private flattenNestedStructure(categories: any[], subNodeName = 'Angular') {
    let result: any = [];

    // Helper function to flatten nodes
    const flatten = (node) => {
        result.push({
            name: node.name,
            breadCrumb: node.breadCrumb,
            createdDate: node.createdDate,
            active: node.active,
        });

        if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
                flatten(child);
            });
        }
    };

    // Traverse the main node to find the subNode
    const findSubNode = (node) => {
        console.log('Traversing node:', node.name);  // Log the node being traversed

        if (typeof node.name === 'string' 
        //  && node.name.trim() === subNodeName
        ) {
            console.log('Found subNode:', node.name);  // Log when the subNode is found
            // Found the subNode, flatten its children
            if (node.children && node.children.length > 0) {
                node.children.forEach((child) => {
                    flatten(child);
                });
            }
        } else if (node.children && node.children.length > 0) {
            // Continue searching in the children
            node.children.forEach((child) => {
                findSubNode(child);
            });
        }
    };

    // Loop through all categories in the array
    categories.forEach((category) => {
        findSubNode(category);
    });

    return result;
}


  
  
  

  private convertFieldToFlatKey(field: string) {
    switch (field) {
      case "category":
      case "exam":
      case "client":
        return `${field}.name`;
      case "assigner":
      case "initialDealAdvisorAssignment":
      case "dealAdvisor1":
      case "dealAdvisor2":
      case "initialContactName":
      case "pricingSupport":
      case "initialCallAttendees":
      case "otherKeyContacts":
      case "responsiblePartners":
        return `${field}.preferredFormattedName`;
      default:
        return field;
    }
  }

  private convertFieldToKey(field: string) {
    switch (field) {
      case "category":
      case "exam":
      case "client":
        return `${field}.name`;
      case "assigner":
      case "initialDealAdvisorAssignment":
      case "dealAdvisor1":
      case "dealAdvisor2":
      case "initialContactName":
      case "pricingSupport":
      case "initialCallAttendees":
      case "otherKeyContacts":
      case "responsiblePartners":
        return `${field}.preferredFormattedName`;
      case "closedDealPerformanceYear":
        return `closedDeals.performanceYear`;
      case "closedDealPerformanceFramework":
        return `closedDeals.performanceFramework`;
      case "closedDealFinalOutcome":
        return `closedDeals.finalOutcome`;
      case "closedDealCalculatedValue":
        return `closedDeals.calculatedValue`;
      case "closedDealSoftCloseDate":
        return `closedDeals.softCloseDate`;
      case "closedDealHardCloseDate":
        return `closedDeals.hardCloseDate`;
      default:
        return field;
    }
  }

  private buildBreadCrumb(node, parentBreadCrumb = "") {
    // Update the breadCrumb for the current node
    node.breadCrumb = parentBreadCrumb
      ? `${parentBreadCrumb} > ${node.name}`
      : node.name;

    // Recursively update breadCrumb for children
    if (node.children) {
      for (const child of node.children) {
        this.buildBreadCrumb(child, node.breadCrumb);
      }
    }

    return node;
  }
}
