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
    res,
    txnId
  ): Promise<any> {
    const query = {};
    // const start = parseInt(params?.startRow?.toString() || '', 10);
    // let sort = this.getSortOrder(params);

    let results = await this.dbService.findAll();
    let allCategories = this.flattenNestedStructure(results);
    let categoriesFiltered = allCategories;

    // Filter by search
    // if(params?.filterModel?.name?.filter) {
    //   response = response.filter(row => row.name.toLowerCase().includes(params.filterModel.name.filter.toLowerCase()));
    // }

    if (params) {
      categoriesFiltered = GridFilterSearchHelper.handleSearchFilter(
        params.filterModel,
        allCategories
      )[0];
    }

    const start = parseInt(params?.startRow?.toString() || "", 10);
    const end = parseInt(params?.endRow?.toString() || "", 10);
    const slicedCategories = this.sliceArray(categoriesFiltered, start, end);
    // let sort = this.getSortOrder(params);

    // Sort
    // response.rows = this.sortCategories(params, response.rows);

    return res
      .status(200)
      .json({ rows: slicedCategories, lastRow: categoriesFiltered.length });
  }

  sliceArray(items: [], start: number, end: number) {
    const result = items.slice(start, end);
    return result;
  }

  private sortCategories(params, arr) {
    if (params.sortModel?.length > 0) {
      const { colId, sort } = params.sortModel[0];
      return arr.rows.sort((a, b) => {
        if (a[colId] < b[colId]) {
          return sort === "asc" ? -1 : 1;
        }
        if (a[colId] > b[colId]) {
          return sort === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
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
    const cats = new Array();
    cats.push(req.body.categories);
    const createCategories: Array<Category> = cats;
    console.info("createCategories req.body", req.body);
    console.info("createCategories cats", cats);

    const linesOfService: Array<Category> = await this.dbService.find(req);
    for (let createCategory of createCategories) {
      console.info("createCategories createCategory", createCategory);
      console.info("createCategories createCategories", createCategories);

      let lineOfServiceIndex = linesOfService.findIndex(
        (category) => category.createUuid === createCategory.createUuid
      );

      console.info("losindex", lineOfServiceIndex);

      if (lineOfServiceIndex !== -1) {
        console.log("Updating category: " + createCategory.name);
        let lineOfService = linesOfService[lineOfServiceIndex];
        lineOfService = this.getUpdatedCategory(lineOfService, createCategory);
        await this.updateCategory(lineOfService);
        linesOfService.splice(lineOfServiceIndex, 1);
      } else {
        console.log("Creating new category: " + createCategory.name);
        const newCategory = new Category();
        newCategory.createUuid = createCategory.createUuid;
        await this.dbService.create(
          this.getUpdatedCategory(newCategory, createCategory)
        );
      }
    }

    for (let lineOfService of linesOfService) {
      lineOfService.active = false;
      await this.updateCategory(lineOfService);
    }

    return this.handleResponse(
      await this.dbService.find({ query: {}, params: {} }),
      res
    );
  }

  public getUpdatedCategory(
    category: Category,
    createCategory: Category
  ): Category {
    const updatedCategory = Object.assign(new Category(), category);
    const missingChildren = Object.assign(
      new Array<Category>(),
      category.children
    );

    updatedCategory._id = updatedCategory._id || new ObjectID().toHexString();
    updatedCategory.createdDate = updatedCategory.createdDate || new Date();
    updatedCategory.name = createCategory.name;
    updatedCategory.createCreatedDate = createCategory.createCreatedDate;
    updatedCategory.active = createCategory.active;

    for (let createSubCategory of createCategory.children) {
      let subCategoryIndex = category.children.findIndex(
        (child) => child.createUuid === createSubCategory.createUuid
      );
      console.log("subCategoryIndex", subCategoryIndex);
      if (subCategoryIndex !== -1) {
        let subCategory = this.getUpdatedCategory(
          category.children[subCategoryIndex],
          createSubCategory
        );
        subCategory.modifiedDate = new Date();
        category.children[subCategoryIndex] = subCategory;
        missingChildren.splice(
          missingChildren.findIndex(
            (c) => c.createUuid === subCategory.createUuid
          ),
          1
        );
      } else {
        const newCategory = new Category();
        newCategory.parent = updatedCategory._id;
        newCategory.createUuid = createSubCategory.createUuid;
        updatedCategory.children.push(
          this.getUpdatedCategory(newCategory, createSubCategory)
        );
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

  private flattenNestedStructure(categories: any[]) {
    let result: any = [];

    const flatten = (node) => {
      result.push({ name: node.name });

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          flatten(child);
        });
      }
    };

    categories.forEach((obj) => flatten(obj));

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
}
