import { DbMicroServiceBase } from "./db-micro-service-base";
import { Category, MdrApplicationUser } from "hipolito-models";
import { ObjectID, ObjectId } from "mongodb";
import { has, isEmpty, isEqual, trim, orderBy } from "lodash";
import { IServerSideGetRowsRequest } from "ag-grid-community";
import { MongoDBUtilities } from "../utils/utilities";
import * as moment from "moment";
import { GridFilterSearchHelper } from "../helpers/gridFilterSearchHelper";
import crypto from "crypto";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// Helper function for generating UUIDs to ensure consistent behavior
function generateUuid() {
  try {
    // Try crypto.randomUUID() first (Node.js 14.17.0+)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    } 
    // Fall back to uuid package
    return uuidv4();
  } catch (error) {
    // Ultimate fallback to a simple UUID generator for testing environments
    const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return pattern.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Define placeholder types (adjust if actual types are known)
interface CategoryGridItem extends Category {
  breadcrumb?: string;
  parent?: string;
}
interface GridResponse<T> {
  rows: T[];
  lastRow: number;
  categories?: any;
  mainCategory?: any;
  category?: any;
}

// Define local interface for sort model items
interface GridSortItem {
  colId: string;
  sort: 'asc' | 'desc';
}

type GridServerSideRowRequest = Partial<IServerSideGetRowsRequest> & {
  search: { search: string; inflightStart: Date; inflightEnd: Date };
  // Ensure sortModel uses the local type if it exists on the extended type
  sortModel?: GridSortItem[]; 
};

export class CategoryService extends DbMicroServiceBase {
  constructor(dbService) {
    super(dbService);
  }

  public async getAll(req, res) {
    try {
      const results = await this.dbService.findAll();

      // Log the first category to verify allowedQuestionTypes is present
      if (results && results.length > 0) {
        console.log('[CategoryService.getAll] First category sample:', {
          _id: results[0]._id,
          name: results[0].name,
          hasAllowedQuestionTypes: !!results[0].allowedQuestionTypes,
          allowedQuestionTypes: results[0].allowedQuestionTypes
        });

        // Log all categories that have allowedQuestionTypes
        const categoriesWithTypes = results.filter(cat => cat.allowedQuestionTypes && cat.allowedQuestionTypes.length > 0);
        console.log(`[CategoryService.getAll] Found ${categoriesWithTypes.length} categories with allowedQuestionTypes out of ${results.length} total`);
      }

      return res.status(200).json({
        result: results,
        count: results.length
      });
    } catch (error) {
      console.error("Error getting all categories:", error);
      return res.status(500).json({
        error: "Failed to retrieve categories",
        message: error.message
      });
    }
  }

  public async getByLineOfService(req, res) {
    return await this.filterLinesOfService(req, res);
  }

  public async getByCategory(req, res) {
    console.log("WARNING: getByCategory called - this might be catching /create requests!");
    console.log("Request URL:", req.url);
    console.log("Request path:", req.path);
    console.log("Request originalUrl:", req.originalUrl);
    let resp;
    resp = await this.filterByCategory(req, res);
    return resp;
  }

  public async createCategory(req, res) {
    console.log("========== CATEGORY CREATE REQUEST ==========");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Request Params:", JSON.stringify(req.params, null, 2));
    console.log("Request Query:", JSON.stringify(req.query, null, 2));
    
    try {
      // Log before calling base post method
      console.log("Calling base class post method...");
      
      // Use the base class post method which handles creation
      const result = await this.post(req, res);
      
      console.log("Post method completed");
      console.log("Result:", result);
      console.log("========== END CATEGORY CREATE ==========");
      
      return result;
    } catch (error) {
      console.error("========== CATEGORY CREATE ERROR ==========");
      console.error("Error Type:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
      console.error("Full Error Object:", error);
      console.error("========== END CATEGORY CREATE ERROR ==========");
      
      return res.status(500).json({ 
        error: "Failed to create category",
        message: error.message,
        details: error.toString()
      });
    }
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
    
    // Safely check if sortModel exists
    if (
      params?.sortModel &&
      params.sortModel[0] &&
      params.sortModel[0].colId === "isInflight"
    ) {
      sort = { isInflight: params.sortModel[0].sort === "asc" ? 1 : -1 };
    }
    
    // Safely handle inflightStart
    if (params?.search?.inflightStart) {
      params.search.inflightStart = new Date();
    }

    // Safely check filterModel
    if (params?.filterModel && has(params.filterModel, "isInflight.values")) {
      if (isEqual(params.filterModel.isInflight.values, ["true"])) {
        inflightFilter = { isInflight: true };
      } else {
        inflightFilter = { isInflight: false };
      }
      delete params.filterModel.isInflight;
    }
    
    // Safe getGridFilter call using null coalescence
    const query = params ? this.getGridFilter(params, "permissions", true) : {};

    const aggregate: any = [
      {
        $match: query,
      },
    ];
    
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
            $slice: ["$rows", start, params?.endRow && params?.startRow ? params.endRow - params.startRow : 10],
          },
        },
      }
    );

    let results = await this.dbService.grid(aggregate);
    const response = results[0] || { rows: [], lastRow: 0 };
    
    return res.status(200).json(response);
  }

  public async gridFlatten(
    req: Request,
    res: Response
  ): Promise<void> {
    const requestStart = Date.now();
    console.log('[PERF-BACKEND] ========== gridFlatten START ==========');
    console.log('[PERF-BACKEND] Request received at:', new Date().toISOString());

    try {
      const txnId = uuidv4();

      if (!req?.body) {
        console.log("[PERF-BACKEND] gridFlatten - Invalid request body");
        res.json({
          rows: [],
          lastRow: 0,
          categories: {},
          mainCategory: {},
          category: {},
        });
        return;
      }

      const params = req.body.params || req.body.session?.body || req.body;
      const userInfo = req.body.userInfo || req.body.session?.user?.userInfo;
      const currentUser = req.body.currentUser || userInfo;

      if (!currentUser) {
        console.log("[PERF-BACKEND] gridFlatten - No user info provided");
        res.json({
          rows: [],
          lastRow: 0,
          categories: {},
          mainCategory: {},
          category: {},
        });
        return;
      }

      const isAdmin = currentUser?.roles?.some(role => role?.name === "System Administrator") ||
                     currentUser['https://learnbytesting_ai/roles']?.includes("Admin");

      console.log("[PERF-BACKEND] gridFlatten - Input:", {
        hasParams: !!params,
        hasUserInfo: !!userInfo,
        isAdmin,
        startRow: params?.startRow,
        endRow: params?.endRow
      });

      // Get initial data
      const dbQueryStart = Date.now();
      console.log('[PERF-BACKEND] Starting filterByCategory2 database query...');

      const initialResults = await this.filterByCategory2(userInfo);

      const dbQueryDuration = Date.now() - dbQueryStart;
      console.log('[PERF-BACKEND] DB query completed in:', dbQueryDuration, 'ms');
      console.log("[PERF-BACKEND] 1. Initial results:", {
        hasResults: !!initialResults,
        resultLength: initialResults?.result?.length
      });

      if (!initialResults || !initialResults.result || initialResults.result.length === 0) {
        console.log("[PERF-BACKEND] gridFlatten - No results found");
        const noDuration = Date.now() - requestStart;
        console.log('[PERF-BACKEND] ========== gridFlatten END (no data) - Total:', noDuration, 'ms ==========');
        res.json({
          rows: [],
          lastRow: 0,
          categories: {},
          mainCategory: {},
          category: {},
        });
        return;
      }

      // Flatten the nested structure
      const flattenStart = Date.now();
      console.log('[PERF-BACKEND] Starting flattenNestedStructure...');

      let flattenedCategories = this.flattenNestedStructure(initialResults.result);

      const flattenDuration = Date.now() - flattenStart;
      console.log('[PERF-BACKEND] Flatten completed in:', flattenDuration, 'ms');
      console.log("[PERF-BACKEND] 2. Flattened categories:", {
        count: flattenedCategories.length,
        sample: flattenedCategories[0]
      });

      // Apply filtering if needed
      let filterDuration = 0;
      if (params?.filterModel) {
        const filterStart = Date.now();
        console.log('[PERF-BACKEND] Starting filtering...');

        flattenedCategories = GridFilterSearchHelper.handleSearchFilter(
          params.filterModel,
          flattenedCategories
        )[0];

        filterDuration = Date.now() - filterStart;
        console.log('[PERF-BACKEND] Filtering completed in:', filterDuration, 'ms');
        console.log("[PERF-BACKEND] 3. After filtering:", {
          count: flattenedCategories.length
        });
      }

      // Apply sorting
      let sortDuration = 0;
      if (params?.sortModel?.length > 0) {
        const sortStart = Date.now();
        console.log('[PERF-BACKEND] Starting sorting...');

        flattenedCategories = this.sortData(flattenedCategories, params.sortModel);

        sortDuration = Date.now() - sortStart;
        console.log('[PERF-BACKEND] Sorting completed in:', sortDuration, 'ms');
        console.log("[PERF-BACKEND] 4. After sorting:", {
          count: flattenedCategories.length
        });
      }

      // Apply pagination
      const paginationStart = Date.now();
      const startRow = parseInt(params?.startRow?.toString() || "0", 10);
      const endRow = parseInt(params?.endRow?.toString() || flattenedCategories.length.toString(), 10);
      const paginatedData = flattenedCategories.slice(startRow, endRow);
      const paginationDuration = Date.now() - paginationStart;

      console.log("[PERF-BACKEND] 5. Final response:", {
        total: flattenedCategories.length,
        pageSize: paginatedData.length,
        startRow,
        endRow
      });

      const totalDuration = Date.now() - requestStart;
      console.log('[PERF-BACKEND] ===== Performance Breakdown =====');
      console.log('[PERF-BACKEND]   DB Query:', dbQueryDuration, 'ms', `(${((dbQueryDuration/totalDuration)*100).toFixed(1)}%)`);
      console.log('[PERF-BACKEND]   Flatten:', flattenDuration, 'ms', `(${((flattenDuration/totalDuration)*100).toFixed(1)}%)`);
      console.log('[PERF-BACKEND]   Filter:', filterDuration, 'ms', `(${((filterDuration/totalDuration)*100).toFixed(1)}%)`);
      console.log('[PERF-BACKEND]   Sort:', sortDuration, 'ms', `(${((sortDuration/totalDuration)*100).toFixed(1)}%)`);
      console.log('[PERF-BACKEND]   Pagination:', paginationDuration, 'ms', `(${((paginationDuration/totalDuration)*100).toFixed(1)}%)`);
      console.log('[PERF-BACKEND] ========== gridFlatten END - Total:', totalDuration, 'ms ==========');

      res.json({
        rows: paginatedData,
        lastRow: flattenedCategories.length,
        categories: initialResults.result[0]?.children || {},
        mainCategory: initialResults.result[0] || {},
        category: initialResults.result[0]?.children || {}
      });

    } catch (error) {
      const errorDuration = Date.now() - requestStart;
      console.error('[PERF-BACKEND] ========== gridFlatten ERROR after', errorDuration, 'ms ==========');
      console.error('[PERF-BACKEND] Error in gridFlatten:', error);
      res.json({
        rows: [],
        lastRow: 0,
        categories: {},
        mainCategory: {},
        category: {},
        error: 'An error occurred while processing the request'
      });
    }
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

  /**
   * Helper method to get sort order with null safety
   */
  private getSortOrder(
    params: GridServerSideRowRequest
  ): Record<string, number> {
    // Ensure params and sortModel exist before trying to access length
    const shouldSort = params?.sortModel && params.sortModel.length > 0;

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
    console.log('updateExistingCategory - Input:', {
      existingCategory: JSON.stringify(existingCategory),
      createCategory: JSON.stringify(createCategory)
    });
    
    // Create a new category instance with existing data
    const updatedCategory = new Category();
    Object.assign(updatedCategory, existingCategory);

    // Update basic properties
    updatedCategory.name = createCategory.name;
    updatedCategory.active = createCategory.active ?? true;
    updatedCategory.modifiedDate = new Date();
    updatedCategory.children = [];

    // Process children if they exist
    if (createCategory.children && Array.isArray(createCategory.children)) {
      console.log('updateExistingCategory - Processing children:', {
        childrenCount: createCategory.children.length
      });
      
      for (const childData of createCategory.children) {
        if (!childData) continue;

        console.log('updateExistingCategory - Processing child:', {
          childName: childData.name,
          childId: childData._id
        });

        // Create child category object
        const childCategory = new Category();
        Object.assign(childCategory, childData);
        childCategory.parent = updatedCategory._id;
        
        // Process child's children recursively
        if (childData.children && Array.isArray(childData.children)) {
          childCategory.children = [];
          for (const grandChild of childData.children) {
            const processedGrandChild = new Category();
            Object.assign(processedGrandChild, grandChild);
            processedGrandChild.parent = childCategory._id;
            childCategory.children.push(processedGrandChild);
          }
        }

        updatedCategory.children.push(childCategory);
      }
    }

    console.log('updateExistingCategory - Final category state:', {
      name: updatedCategory.name,
      childrenCount: updatedCategory.children.length,
      children: updatedCategory.children.map(c => ({
        name: c.name,
        childrenCount: c.children?.length || 0
      }))
    });

    // Update in database
    await this.dbService.update({
      params: { id: updatedCategory._id },
      body: updatedCategory
    });

    return updatedCategory;
  }

  private async createNewCategory(categoryData: Category): Promise<Category> {
    console.log("=== START createNewCategory ===");
    console.log("Input categoryData:", {
        name: categoryData.name,
        _id: categoryData._id,
        parent: categoryData.parent,
        createUuid: categoryData.createUuid
    });
    
    const newCategory = new Category();
    
    // Set basic properties
    newCategory._id = categoryData._id || generateUuid();
    newCategory.name = categoryData.name;
    newCategory.active = categoryData.active ?? true;
    newCategory.createUuid = categoryData.createUuid;
    newCategory.parent = categoryData.parent;
    newCategory.createdDate = new Date();
    newCategory.createCreatedDate = categoryData.createCreatedDate || new Date();
    newCategory.modifiedDate = new Date();
    newCategory.children = [];

    console.log("Created new category object:", {
        _id: newCategory._id,
        name: newCategory.name,
        parent: newCategory.parent,
        active: newCategory.active
    });

    // If there's a parent ID, find and update the parent document
    if (categoryData.parent) {
        console.log("Finding parent category with ID:", categoryData.parent);
        const parentCategory = await this.dbService.find({
            query: { _id: categoryData.parent }
        });

        console.log("Parent category search result:", {
            found: parentCategory && parentCategory.length > 0,
            parentData: parentCategory && parentCategory.length > 0 ? {
                _id: parentCategory[0]._id,
                name: parentCategory[0].name,
                childrenCount: parentCategory[0].children?.length || 0
            } : null
        });

        if (parentCategory && parentCategory.length > 0) {
            const parent = parentCategory[0];
            console.log("Found parent category:", parent.name);

            // Initialize children array if it doesn't exist
            if (!Array.isArray(parent.children)) {
                console.log("Initializing empty children array for parent");
                parent.children = [];
            }

            // Check if child already exists
            const existingChildIndex = parent.children.findIndex(child => 
                child._id === newCategory._id || child.createUuid === newCategory.createUuid
            );

            if (existingChildIndex !== -1) {
                console.log("Updating existing child in parent's children array");
                parent.children[existingChildIndex] = newCategory;
            } else {
                console.log("Adding new child to parent's children array");
                parent.children.push(newCategory);
            }

            // Update the parent document with the new/updated child
            console.log("Updating parent document. Parent state:", {
                _id: parent._id,
                name: parent.name,
                childrenCount: parent.children.length,
                lastAddedChild: parent.children[parent.children.length - 1].name
            });

            try {
                await this.dbService.update({
                    params: { id: parent._id },
                    body: parent
                });
                console.log("Successfully updated parent document");
            } catch (error) {
                console.error("Error updating parent document:", error);
                throw error;
            }

            return newCategory;
        } else {
            console.error("Parent category not found:", categoryData.parent);
            throw new Error(`Parent category not found: ${categoryData.parent}`);
        }
    } else {
        // Only create a new document if this is a root category
        console.log("Creating root category (no parent)");
        try {
            await this.dbService.create(newCategory);
            console.log("Successfully created root category");
        } catch (error) {
            console.error("Error creating root category:", error);
            throw error;
        }
    }

    console.log("=== END createNewCategory ===");
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
    return await this.dbService.update(lineOfService);
  }

  public getUpdatedCategory(existingCategory: Category, newCategory: Category): Category {
    const updatedCategory = new Category();
    
    // Preserve existing IDs and dates
    updatedCategory._id = existingCategory._id;
    updatedCategory.createdDate = existingCategory.createdDate;
    updatedCategory.createCreatedDate = existingCategory.createCreatedDate;
    updatedCategory.createUuid = existingCategory.createUuid;
    updatedCategory.parent = existingCategory.parent; // Ensure parent ID is preserved
    
    // Update category properties
    updatedCategory.name = newCategory.name;
    updatedCategory.active = newCategory.active;
    updatedCategory.modifiedDate = new Date();
    updatedCategory.children = [];

    // Process children
    if (newCategory.children && newCategory.children.length > 0) {
      for (const newChild of newCategory.children) {
        const updatedChild = new Category();
        
        // Set parent ID for the child
        updatedChild.parent = updatedCategory._id;
        
        // Find existing child by UUID or create new
        const existingChild = existingCategory.children?.find(
          child => child.createUuid === newChild.createUuid
        );

        if (existingChild) {
          // Preserve existing child's IDs and dates
          updatedChild._id = existingChild._id;
          updatedChild.createdDate = existingChild.createdDate;
          updatedChild.createCreatedDate = existingChild.createCreatedDate;
          updatedChild.createUuid = existingChild.createUuid;
        } else {
          // Generate new ID for new child
          updatedChild._id = newChild._id || generateUuid();
          updatedChild.createdDate = new Date();
          updatedChild.createCreatedDate = newChild.createCreatedDate;
          updatedChild.createUuid = newChild.createUuid;
        }

        // Update child properties
        updatedChild.name = newChild.name;
        updatedChild.active = newChild.active;
        updatedChild.modifiedDate = new Date();
        
        // Process grandchildren recursively
        if (newChild.children && newChild.children.length > 0) {
          const existingChildWithChildren = existingChild || new Category();
          updatedChild.children = this.getUpdatedCategory(existingChildWithChildren, newChild).children;
        } else {
          updatedChild.children = [];
        }

        updatedCategory.children.push(updatedChild);
      }
    }

    return updatedCategory;
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
    ).length > 0 || currentUser?.['https://learnbytesting_ai/roles']?.includes("Admin");

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

  public async filterByCategory2(userInfo: any): Promise<any> {
    console.log('filterByCategory2 - Input:', {
      hasUserInfo: !!userInfo,
      userInfoType: typeof userInfo,
      userInfoKeys: userInfo ? Object.keys(userInfo) : [],
      mainCategory: userInfo?.mainCategory,
      category: userInfo?.category,
      mainCategoryType: userInfo?.mainCategory ? typeof userInfo.mainCategory : 'undefined',
      mainCategoryLength: userInfo?.mainCategory?.length,
      categoryLength: userInfo?.category?.length
    });

    // Check if user is admin based on roles
    const isAdmin = userInfo?.roles?.some(role => role?.name === "System Administrator") || 
                   userInfo?.['https://learnbytesting_ai/roles']?.includes("Admin") || 
                   userInfo?.['https://learnbytesting.ai/roles']?.includes("Admin") || 
                   false;
    
    if (isAdmin) {
      console.log('filterByCategory2 - Getting all categories for admin');
      let result = await super.getSubCategory2Data('', '', isAdmin, '');
      console.log('filterByCategory2 - Subcategory result:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        resultLength: result?.result?.length
      });
      return result;
    }

    if (!userInfo?.mainCategory?.length) {
      console.log('filterByCategory2 - No main category found, returning empty result');
      return { result: [], count: 0 };
    }

    const mainCategory = { ...userInfo.mainCategory[0], children: [] };
    console.log('filterByCategory2 - Main category:', {
      mainCategoryId: mainCategory._id,
      mainCategoryName: mainCategory.name,
      mainCategoryKeys: Object.keys(mainCategory)
    });

    const category = userInfo.mainCategory[0].children ? {
      ...userInfo.mainCategory[0].children,
      count: userInfo.mainCategory[0].children.length,
    } : { count: 0, children: [] };

    console.log('filterByCategory2 - Category:', {
      categoryName: category.name,
      categoryId: category._id,
      childrenCount: category.count,
      categoryKeys: Object.keys(category)
    });

    const categories = userInfo.mainCategory[0].children || {};
    console.log('filterByCategory2 - Categories:', {
      hasCategories: !!categories,
      categoriesCount: Object.keys(categories).length,
      categoriesKeys: Object.keys(categories)
    });

    console.log('filterByCategory2 - Getting subcategory data for non-admin');
    return super.getSubCategory2Data(mainCategory.name, category.name, isAdmin, category.id);
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

  private flattenNestedStructure(categories: any[]): any[] {
    let result: any[] = [];

    const flatten = (node: any, parentPath = '') => {
      if (!node) return;

      // Create flattened item
      const flatItem = {
        _id: node._id,
        name: node.name,
        active: node.active,
        createdDate: node.createdDate,
        modifiedDate: node.modifiedDate,
        createUuid: node.createUuid,
        parent: node.parent,
        breadcrumb: parentPath ? `${parentPath} > ${node.name}` : node.name
      };

      result.push(flatItem);

      // Recursively flatten children
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          flatten(child, flatItem.breadcrumb);
        });
      }
    };

    // Process each root category
    categories.forEach(category => {
      flatten(category);
    });

    return result;
  }

  private convertFieldToFlatKey(field: string) {
    switch (field) {
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

  // Add helper method for sorting data
  private sortData(data: any[], sortModel: GridSortItem[]): any[] {
    if (!sortModel || sortModel.length === 0) {
      return data;
    }
    // Filter out sortModel items that don't have a sort direction (shouldn't happen with GridSortItem but good practice)
    const validSortModel = sortModel.filter(s => s.sort);
    if (validSortModel.length === 0) {
        return data;
    }

    const sortKeys = validSortModel.map(s => s.colId);
    const sortOrders = validSortModel.map(s => s.sort);

    return orderBy(data, sortKeys, sortOrders);
  }

  /**
   * Deletes a category from the deeply nested structure by finding its parent and removing it from the hierarchy
   */
  public async delete(req, res) {
    console.log("==== START CATEGORY DELETE OPERATION ====");
    console.log("Delete request params:", {
      params: req.params,
      query: req.query,
      id: req.params.id,
      hasIdParam: !!req.params.id
    });

    try {
      // Get the category ID from the request
      const categoryId = req.params.id;
      if (!categoryId) {
        console.error("Error: No category ID provided in delete request");
        return res.status(400).json({ 
          success: false, 
          message: "No category ID provided" 
        });
      }

      console.log(`Attempting to delete category with ID: ${categoryId}`);

      // First get all root categories
      const allRootCategories = await this.dbService.findAll();
      console.log(`Found ${allRootCategories.length} root categories`);

      // Helper function to recursively find a category and its parent in the nested structure
      const findCategoryAndParent = (categories, targetId, parent = null, path = []) => {
        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          const currentPath = [...path, i];
          
          // Check if this is the category we're looking for
          if (category._id && category._id.toString() === targetId.toString()) {
            return { 
              category, 
              parent, 
              index: i,
              path: currentPath
            };
          }
          
          // Recursively search in children if they exist
          if (category.children && category.children.length > 0) {
            const result = findCategoryAndParent(
              category.children, 
              targetId, 
              category,
              [...currentPath, 'children']
            );
            if (result) return result;
          }
        }
        return null;
      };

      // Find the category and its parent
      let foundInfo = null;
      
      // First, check if it's a root category
      for (let i = 0; i < allRootCategories.length; i++) {
        if (allRootCategories[i]._id && 
            allRootCategories[i]._id.toString() === categoryId.toString()) {
          foundInfo = {
            category: allRootCategories[i],
            parent: null,
            index: i,
            path: [i],
            isRoot: true
          };
          break;
        }
      }
      
      // If not a root category, search the entire tree
      if (!foundInfo) {
        for (const rootCategory of allRootCategories) {
          if (rootCategory.children && rootCategory.children.length > 0) {
            foundInfo = findCategoryAndParent(rootCategory.children, categoryId, rootCategory);
            if (foundInfo) {
              // Add the root category info
              foundInfo.rootCategory = rootCategory;
              break;
            }
          }
        }
      }

      if (!foundInfo) {
        console.error(`Category with ID ${categoryId} not found in the nested structure`);
        return res.status(404).json({
          success: false,
          message: `Category with ID ${categoryId} not found`
        });
      }

      console.log("Found category to delete:", {
        id: foundInfo.category._id,
        name: foundInfo.category.name,
        hasChildren: foundInfo.category.children && foundInfo.category.children.length > 0,
        childrenCount: foundInfo.category.children?.length || 0,
        isRoot: foundInfo.isRoot,
        parentName: foundInfo.parent?.name,
        path: foundInfo.path.join(' > ')
      });

      let result;
      
      // Handle deletion based on whether it's a root category or a child category
      if (foundInfo.isRoot) {
        // It's a root category, we can delete it directly
        console.log(`Deleting root category: ${foundInfo.category.name}`);
        result = await this.dbService.delete({
          params: { id: categoryId }
        });
        console.log("Root category deletion result:", result);
      } else {
        // It's a nested category, we need to remove it from its parent's children array
        console.log(`Removing category from parent: ${foundInfo.parent.name}`);
        
        // Remove the category from its parent's children array
        foundInfo.parent.children.splice(foundInfo.index, 1);
        
        // Update the parent document
        const rootToUpdate = foundInfo.rootCategory || foundInfo.parent;
        console.log(`Updating root document: ${rootToUpdate.name} (${rootToUpdate._id})`);
        
        result = await this.dbService.update({
          params: { id: rootToUpdate._id },
          body: rootToUpdate
        });
        
        console.log("Parent update result:", result);
      }

      console.log("==== END CATEGORY DELETE OPERATION ====");
      return res.status(200).json({
        success: true,
        message: `Category ${foundInfo.category.name} successfully deleted`,
        deletedCategory: foundInfo.category,
        result: result
      });

    } catch (error) {
      console.error("Error in category delete operation:", error);
      console.log("==== END CATEGORY DELETE OPERATION WITH ERROR ====");
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the category",
        error: error.message
      });
    }
  }

  /**
   * Get a category by ID with resolved (inherited) aiConfig
   * Traverses up the parent chain and merges aiConfig from ancestors
   * Child config takes precedence over parent config
   */
  public async getCategoryWithResolvedAiConfig(req, res) {
    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required"
      });
    }

    try {
      console.log(`[aiConfig] Getting category with resolved aiConfig for ID: ${categoryId}`);

      // Get all root categories to search through
      const allRootCategories = await this.dbService.findAll();

      // Find the category in the nested structure and build the parent chain
      const categoryChain = this.findCategoryChain(allRootCategories, categoryId);

      if (!categoryChain || categoryChain.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Category with ID ${categoryId} not found`
        });
      }

      // The target category is the last in the chain
      const targetCategory = categoryChain[categoryChain.length - 1];

      // Resolve the aiConfig by merging from root to leaf
      const resolvedAiConfig = this.resolveAiConfig(categoryChain);

      console.log(`[aiConfig] Resolved aiConfig for ${targetCategory.name}:`, JSON.stringify(resolvedAiConfig, null, 2));

      return res.status(200).json({
        success: true,
        category: {
          _id: targetCategory._id,
          name: targetCategory.name,
          parent: targetCategory.parent,
          aiConfig: targetCategory.aiConfig,
          resolvedAiConfig: resolvedAiConfig,
          ancestorChain: categoryChain.map(c => ({ _id: c._id, name: c.name }))
        }
      });
    } catch (error) {
      console.error("[aiConfig] Error getting category with resolved aiConfig:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while getting category aiConfig",
        error: error.message
      });
    }
  }

  /**
   * Find a category and return the full chain from root to the target category
   */
  private findCategoryChain(categories: any[], targetId: string, currentChain: any[] = []): any[] | null {
    for (const category of categories) {
      // Build a chain including this category
      const newChain = [...currentChain, category];

      // Check if this is the target
      if (category._id && category._id.toString() === targetId.toString()) {
        return newChain;
      }

      // Search in children
      if (category.children && category.children.length > 0) {
        const result = this.findCategoryChain(category.children, targetId, newChain);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  /**
   * Resolve aiConfig by merging configs from root to leaf
   * Later configs in the chain override earlier ones
   */
  private resolveAiConfig(categoryChain: any[]): any {
    let resolvedConfig: any = {};

    for (const category of categoryChain) {
      // Skip if no aiConfig or inheritance is disabled
      if (!category.aiConfig) continue;

      // Check if this category allows inheritance
      // (if a parent has inheritToChildren: false, don't inherit from it)
      // Note: We check this on the current category's config for its children

      // Deep merge the aiConfig
      resolvedConfig = this.deepMergeAiConfig(resolvedConfig, category.aiConfig);
    }

    return resolvedConfig;
  }

  /**
   * Deep merge two aiConfig objects
   * The second (child) config takes precedence
   */
  private deepMergeAiConfig(parentConfig: any, childConfig: any): any {
    if (!parentConfig) return childConfig;
    if (!childConfig) return parentConfig;

    const result: any = { ...parentConfig };

    // Merge top-level string fields (child takes precedence if defined)
    if (childConfig.systemPrompt) {
      result.systemPrompt = childConfig.systemPrompt;
    }
    if (childConfig.domainContext) {
      result.domainContext = childConfig.domainContext;
    }

    // Merge flashcardConfig
    if (childConfig.flashcardConfig) {
      result.flashcardConfig = {
        ...parentConfig.flashcardConfig,
        ...childConfig.flashcardConfig
      };

      // Arrays should be replaced, not merged (child's arrays take precedence)
      if (childConfig.flashcardConfig.defaultCategories) {
        result.flashcardConfig.defaultCategories = childConfig.flashcardConfig.defaultCategories;
      }
      if (childConfig.flashcardConfig.focusAreas) {
        result.flashcardConfig.focusAreas = childConfig.flashcardConfig.focusAreas;
      }
    }

    // Merge questionConfig
    if (childConfig.questionConfig) {
      result.questionConfig = {
        ...parentConfig.questionConfig,
        ...childConfig.questionConfig
      };

      if (childConfig.questionConfig.questionTypes) {
        result.questionConfig.questionTypes = childConfig.questionConfig.questionTypes;
      }
    }

    // Merge transcriptConfig
    if (childConfig.transcriptConfig) {
      result.transcriptConfig = {
        ...parentConfig.transcriptConfig,
        ...childConfig.transcriptConfig
      };

      if (childConfig.transcriptConfig.extractionRules) {
        result.transcriptConfig.extractionRules = childConfig.transcriptConfig.extractionRules;
      }
    }

    // inheritToChildren from the child takes precedence
    if (childConfig.inheritToChildren !== undefined) {
      result.inheritToChildren = childConfig.inheritToChildren;
    }

    return result;
  }

  /**
   * Update aiConfig for a category in the deeply nested structure
   * This method properly handles the nested document structure where all categories
   * are stored as children within a single root document
   */
  public async updateCategoryAiConfig(req, res) {
    console.log("==== START UPDATE CATEGORY AI CONFIG ====");

    const categoryId = req.params.id;
    const aiConfig = req.body.aiConfig;

    console.log("Update aiConfig request:", {
      categoryId,
      aiConfig: JSON.stringify(aiConfig, null, 2)
    });

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required"
      });
    }

    try {
      // Import CategoryModel - it's the same one used in db-micro-service-base
      const { CategoryModel } = require('../models/category.model');

      // Get all root categories (actual MongoDB documents)
      const allRootCategories = await CategoryModel.find({}).lean();
      console.log(`Found ${allRootCategories.length} root categories`);

      // Find which root category contains the target (could be root itself or nested)
      let targetRootId = null;
      let isTargetAtRoot = false;
      let updatedRootDoc = null;

      for (const rootCategory of allRootCategories) {
        const rootIdStr = rootCategory._id.toString();

        // Check if the root category itself is the target
        if (rootIdStr === categoryId.toString()) {
          console.log(`Found target at root level: ${rootCategory.name} (${rootIdStr})`);
          targetRootId = rootIdStr;
          isTargetAtRoot = true;
          break;
        }

        // Search recursively in children
        const findInChildren = (children: any[]): boolean => {
          if (!children || !Array.isArray(children)) return false;
          for (const child of children) {
            if (child._id && child._id.toString() === categoryId.toString()) {
              return true;
            }
            if (child.children && findInChildren(child.children)) {
              return true;
            }
          }
          return false;
        };

        if (rootCategory.children && findInChildren(rootCategory.children)) {
          console.log(`Found target nested in root: ${rootCategory.name} (${rootIdStr})`);
          targetRootId = rootIdStr;
          updatedRootDoc = rootCategory;
          break;
        }
      }

      if (!targetRootId) {
        console.error(`Category with ID ${categoryId} not found in any root category`);
        return res.status(404).json({
          success: false,
          message: `Category with ID ${categoryId} not found`
        });
      }

      console.log(`Target root ID: ${targetRootId}, isTargetAtRoot: ${isTargetAtRoot}`);

      let updateResult;

      if (isTargetAtRoot) {
        // Direct update to root document using $set
        console.log("Updating root document directly with $set");
        updateResult = await CategoryModel.findByIdAndUpdate(
          targetRootId,
          {
            $set: {
              aiConfig: aiConfig,
              modifiedDate: new Date()
            }
          },
          { new: true }
        );
      } else {
        // For nested categories, update the nested object and save the entire children array
        const updateInChildren = (children: any[]): boolean => {
          if (!children || !Array.isArray(children)) return false;
          for (const child of children) {
            if (child._id && child._id.toString() === categoryId.toString()) {
              child.aiConfig = aiConfig;
              child.modifiedDate = new Date();
              console.log(`Updated nested category in memory: ${child.name}`);
              return true;
            }
            if (child.children && updateInChildren(child.children)) {
              return true;
            }
          }
          return false;
        };

        updateInChildren(updatedRootDoc.children);

        // Save the root document with updated children
        console.log("Saving root document with updated nested category");
        updateResult = await CategoryModel.findByIdAndUpdate(
          targetRootId,
          {
            $set: {
              children: updatedRootDoc.children,
              modifiedDate: new Date()
            }
          },
          { new: true }
        );
      }

      if (!updateResult) {
        console.error(`Failed to update category - findByIdAndUpdate returned null`);
        return res.status(500).json({
          success: false,
          message: "Failed to update category in database"
        });
      }

      console.log("Category aiConfig updated successfully");
      console.log("==== END UPDATE CATEGORY AI CONFIG - SUCCESS ====");
      return res.status(200).json({
        success: true,
        message: "AI configuration updated successfully"
      });

    } catch (error) {
      console.error("Error updating category aiConfig:", error);
      console.log("==== END UPDATE CATEGORY AI CONFIG - ERROR ====");
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating AI configuration",
        error: error.message
      });
    }
  }
}