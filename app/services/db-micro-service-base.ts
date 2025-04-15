import { DbServiceBase } from './db-service-base';
import { ApiResponseHelper } from './utilities';
import { ApiResponse, PagedApiResponse, MdrApplicationUser } from 'hipolito-models';
import { DbPagedResults } from '../models';
import { Request } from '@root/request';
import { UnauthorizedException } from './errors/unauthorized-exception';
import { ObjectId } from 'mongodb';
import { Category } from '../models/category.model';

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
        
        let result = await Category.aggregate([
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


public async getSubCategory(categoryName, subCategoryName, res, isAdmin, getAllCategories) {
    let parentConditions:any = {};
    let result;
    
    // Only apply category filters if not admin and not getting all categories
    if (!isAdmin && !getAllCategories) {
        parentConditions = {
            name: categoryName,
            active: true
        };

        // Aggregate to match the parent category and filter the subcategory and its children
        result = await Category.aggregate([
            {
                $match: parentConditions // Match the parent category
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    children: {
                        $filter: {
                            input: "$children",
                            as: "child",
                            cond: {
                                $and: [
                                    { $eq: ["$$child.name", subCategoryName] },
                                    { $eq: ["$$child.active", true] }
                                ]
                            }
                        }
                    }
                }
            }
        ]).exec();

        // If no results found, return empty array with proper structure
        if (!result || result.length === 0) {
            return this.handlePagedResponse({ 
                result: [{ _id: null, name: categoryName, children: [] }], 
                count: 0 
            }, res);
        }

        // Ensure each result has a children array
        result = result.map(item => ({
            ...item,
            children: item.children || []
        }));
    } else {
        // For admin or getAllCategories, get all categories without filtering
        result = await Category.aggregate([
            {
                $project: {
                    _id: 1,
                    name: 1,
                    children: 1
                }
            }
        ]).exec();

        // If no results found, return empty array with proper structure
        if (!result || result.length === 0) {
            return this.handlePagedResponse({ 
                result: [{ _id: null, name: categoryName, children: [] }], 
                count: 0 
            }, res);
        }

        // Ensure each result has a children array
        result = result.map(item => ({
            ...item,
            children: item.children || []
        }));
    }

    return this.handlePagedResponse({ result, count: result.length }, res);
}

public async getSubCategory2(mainCategory: string, categoryName: string, res, isAdmin: boolean, categoryId: string) {
    // Call the new data-only method and handle the response here
    const resultData = await this.getSubCategory2Data(mainCategory, categoryName, isAdmin, categoryId);
    return this.handlePagedResponse(resultData, res);
}

// New method that returns data without sending a response
public async getSubCategory2Data(mainCategory: string, categoryName: string, isAdmin: boolean, categoryId: string) {
    let parentConditions = {};
    if (isAdmin) {
        parentConditions = {};
    } else {
        parentConditions = { active: true };
    }

    let result = await Category.aggregate([
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
                'subcategories.mainCategoryId': mainCategory,
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

    if (!isAdmin) {
        result = result.map(parent => this.filterNonActiveChildren(parent));
    }

    // Return the data without sending a response
    return { result, count: 0 };
}


    public async getNestedByCategory(idArr, res, isAdmin, getAllCategories, mainCategoryId, categoryId) {
        let parentConditions = {};
        if (isAdmin || getAllCategories) {
            parentConditions = idArr ? { _id: { $in: idArr } } : {};
        } else {
            parentConditions = idArr ? { _id: { $in: idArr }, active: true } : {};
        }
    
        let result = await Category.aggregate([
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
        try {
            this.onPrePost(req.body);
            const result = await this.dbService.create(req.body);
            return this.handleResponse(result, res);
        } catch (error) {
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
