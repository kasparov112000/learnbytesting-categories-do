import { DbServiceBase } from './db-service-base';
import { ApiResponseHelper } from './utilities';
import { ApiResponse, PagedApiResponse, MdrApplicationUser } from 'hipolito-models';
import { DbPagedResults } from '../models';
import { Request } from '@root/request';
import { UnauthorizedException } from './errors/unauthorized-exception';
import { ObjectId } from 'mongodb';
import { CategoryModel } from '../models/category.model';

export abstract class DbMicroServiceBase {
    protected dbService: DbServiceBase;

    constructor(dbService: DbServiceBase) {
        this.dbService = dbService;
    }

    protected async getCurrentUser(req: Request): Promise<MdrApplicationUser> {
        if(!req.body.currentUser) {
            throw new UnauthorizedException('No user was provided as part of the request. currentUser is required when filtering based on the current user.');
        }

        return req.body.currentUser as MdrApplicationUser;
    }

    

    public async get(req, res) {
        try {
            let result;
            if (req.query && req.query.page && req.query.pageSize) {
                result = await this.dbService.findPaged(req);
                console.log('result: db-micro-service-base.ts', result);
                return this.handlePagedResponse(result, res);
            }
            else {
                result = await this.dbService.find(req);
                return this.handleResponse(result, res);
            }
        } catch (error) {
            return this.handleErrorResponse(error, res);
        }
    }

    public async getNested(idArr, res, isAdmin, getAllCategories) {
        let parentConditions = {};
        if(isAdmin || getAllCategories) {
             parentConditions = idArr ? { _id: { $in: idArr }  } : {};
        } else {
            parentConditions = idArr ? { _id: { $in: idArr }, active: true } : {};
        }

        // Aggregate to filter parent documents and their nested items
        
        let result = await CategoryModel.aggregate([
          {
            $match: parentConditions
          },
        ])

        .exec();

        if (!isAdmin && !getAllCategories) {
        result = result.map(parent => this.filterNonActiveChildren(parent));
        }

        return this.handlePagedResponse({result, count: 0}, res);
    }


public async getSubCategory(mainCategory: string | null, category: string | null, res: any, isAdmin: boolean, getAllCategories: boolean) {
    let result;
    try {
        if (isAdmin || getAllCategories) {
            let result = await CategoryModel.aggregate([
                {
                    $match: {
                        active: true
                    }
                }
            ]);
            return this.handleResponse(result, res);
        }

        if (!mainCategory || !category) {
            result = await CategoryModel.aggregate([
                {
                    $match: {
                        active: true,
                        name: { $in: [mainCategory, category].filter(Boolean) }
                    }
                }
            ]);
        } else {
            result = await CategoryModel.aggregate([
                {
                    $match: {
                        active: true,
                        name: mainCategory
                    }
                }
            ]);
        }

        return this.handleResponse(result, res);
    } catch (error) {
        console.error('Error in getSubCategory:', error);
        return this.handleResponse([], res);
    }
}

public async getSubCategory2(mainCategory: string, categoryName: string, res, isAdmin: boolean, categoryId: string) {
    // Call the new data-only method and handle the response here
    const resultData = await this.getSubCategory2Data(mainCategory, categoryName, isAdmin, categoryId);
    return this.handlePagedResponse(resultData, res);
}

// New method that returns data without sending a response
public async getSubCategory2Data(mainCategory: string, categoryName: string, isAdmin: boolean, categoryId: string): Promise<{ result: any[], count: number }> {
    console.log('getSubCategory2Data - Input:', { mainCategory, categoryName, isAdmin, categoryId });

    // Build a simple query for root categories (documents with no parent)
    // Categories use nested 'children' array structure, not a separate collection
    const query: any = {
        parent: { $exists: false } // Only get root categories
    };

    // Add active filter for non-admin users
    if (!isAdmin) {
        query.active = true;
    }

    // If a specific mainCategory is requested, filter by name
    if (mainCategory) {
        query.name = mainCategory;
        console.log('getSubCategory2Data - Filtering by mainCategory:', mainCategory);
    }

    console.log("getSubCategory2Data: Executing query:", JSON.stringify(query));

    // Execute simple find query instead of complex aggregation
    let result = await CategoryModel.find(query).lean().exec();

    console.log(`getSubCategory2Data: Query executed. Found ${result.length} root categories.`);

    // Filter non-active children for non-admin users
    if (!isAdmin) {
        console.log("getSubCategory2Data: Filtering non-active children for non-admin.");
        result = result.map(parent => this.filterNonActiveChildren(parent));
    }

    // Return the data with the actual count
    console.log("getSubCategory2Data: Returning data.", { count: result.length });
    return { result, count: result.length };
}


    public async getNestedByCategory(idArr, res, isAdmin, getAllCategories, mainCategoryId, categoryId) {
        let parentConditions = {};
        if (isAdmin || getAllCategories) {
            parentConditions = idArr ? { _id: { $in: idArr } } : {};
        } else {
            parentConditions = idArr ? { _id: { $in: idArr }, active: true } : {};
        }
    
        let result = await CategoryModel.aggregate([
            {
                $match: parentConditions
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: '_id',
                    foreignField: 'parentCategoryId',
                    as: 'subcategories'
                }
            },
            {
                $unwind: {
                    path: '$subcategories',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'subcategories.mainCategoryId': mainCategoryId,
                    'subcategories._id': categoryId
                }
            },
            {
                $group: {
                    _id: '$_id',
                    parentCategory: { $first: '$$ROOT' },
                    subcategories: { $push: '$subcategories' }
                }
            }
        ]).exec();
    
        if (!isAdmin && !getAllCategories) {
            result = result.map(parent => this.filterNonActiveChildren(parent));
        }
    
        return this.handlePagedResponse({ result, count: 0 }, res);
    }

    public filterNonActiveChildren(parent: any) {
        if (parent.children) {
            if (Array.isArray(parent.children)) {
            parent.children = parent.children.filter(child => child.active);
            parent.children.forEach(child => this.filterNonActiveChildren(child));
            }
        }

        return parent;
    }

    public async getById(req, res) {
        try {
            if (!req.params || !req.params.id) {
                throw new Error('getById requires an Id.');
            }

            const result = await this.dbService.findById(req.params.id);
            return this.handleResponse(result, res);
        } catch (error) {
            return this.handleErrorResponse(error, res);
        }
    }

    public async post(req, res) {
        console.log("=== DB-MICRO-SERVICE-BASE POST ===");
        console.log("Request body before onPrePost:", JSON.stringify(req.body, null, 2));
        
        try {
            this.onPrePost(req.body);
            console.log("Request body after onPrePost:", JSON.stringify(req.body, null, 2));
            
            console.log("Calling dbService.create...");
            const result = await this.dbService.create(req.body);
            console.log("dbService.create result:", JSON.stringify(result, null, 2));
            
            console.log("Calling handleResponse...");
            const response = this.handleResponse(result, res);
            console.log("=== END DB-MICRO-SERVICE-BASE POST ===");
            return response;
        } catch (error) {
            console.error("=== DB-MICRO-SERVICE-BASE POST ERROR ===");
            console.error("Error in post method:", error);
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            return this.handleErrorResponse(error, res);
        }
    }

    public async patch(req, res) {
        try {
            this.onPrePatch(req.body);
            const result = await this.dbService.update(req.body);
            return this.handleResponse(result, res);
        } catch (error) {
            return this.handleErrorResponse(error, res);
        }
    }

    public async put(req, res) {
        try {
            this.onPrePut(req);
            const result = await this.dbService.update(req);
            return this.handleResponse(result, res);
        } catch (error) {
            return this.handleErrorResponse(error, res);
        }
    }

    public async delete(req, res) {
        try {
            const result = await this.dbService.delete(req);
            return this.handleResponse(result, res);
        } catch (error) {
            return this.handleErrorResponse(error, res);
        }
    }

    protected handleResponse<TResponse = any>(result, res): any {
        const apiResponse = new ApiResponse<TResponse>(result);
        return res.status(apiResponse.statusCode).json(apiResponse);
    }

    protected handlePagedResponse<TResponse = any>(result: DbPagedResults<TResponse>, res): any {
        const apiResponse = new PagedApiResponse<TResponse>(result.result, result.count);
        return res.status(apiResponse.statusCode).json(apiResponse);
    }

    public formatSearch(req) {
        if (req.query['Category._id']) {
            const catId = req.query['Category._id'];
            req.params = {'Category._id': catId};    
        } else if(req.query['Category.name']) {
            const catNameValue = req.query['Category.name'];
            req.params = {'Category.name': catNameValue}
        }
    }

    protected handleErrorResponse<TResponse = any>(error, res): any {
        let apiErrorResponse: ApiResponse<TResponse>;

        switch (error.name) {
            case 'ValidationError':
                apiErrorResponse = ApiResponseHelper.getValidationErrorResponse(error);
                break;
            case 'UnauthorizedException':
                apiErrorResponse = ApiResponseHelper.getErrorResponse(error, 401);
                break;
            case 'NotFoundException':
                apiErrorResponse = ApiResponseHelper.getErrorResponse(error, 404);
                break;
            default:
                apiErrorResponse = ApiResponseHelper.getErrorResponse(error);
                break;
        }

        return res.status(apiErrorResponse.statusCode).json(apiErrorResponse);
    }

    protected onPrePost(model): void {
        const user = model.user && model.user.authenticatedInfo ? model.user.authenticatedInfo.guid : 'SYSTEM';
        model.createdByGuid = user;
        model.createdDate = new Date();
        model.modifiedDate = new Date();
        model.modifiedByGuid = user;
    }

    protected onPrePut(req) {
        const user = req.body.currentUser && req.body.currentUser.info ? req.body.currentUser.info.guid : 'SYSTEM';
        req.body.modifiedDate = new Date();
        req.body.modifiedByGuid = user;
    }

    protected onPrePatch(req) {
        const user = req.body.currentUser && req.body.currentUser.info ? req.body.currentUser.info.guid : 'SYSTEM';
        req.body.modifiedDate = new Date();
        req.body.modifiedByGuid = user;
    }
}
