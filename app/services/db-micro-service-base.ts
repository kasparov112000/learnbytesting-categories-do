import { DbServiceBase } from './db-service-base';
import { ApiResponseHelper } from './utilities';
import { ApiResponse, PagedApiResponse, MdrApplicationUser } from 'hipolito-models';
import { DbPagedResults, category } from '../models';
import { Request } from '@root/request';
import { UnauthorizedException } from './errors/unauthorized-exception';
import { ObjectId } from 'mongodb';

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
        
        let result = await  category.aggregate([
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

    let parentConditions:any = {
        name: categoryName,
        // active: true
    };
    let result;

    // If not an admin and not getting all categories, only show active categories
    if (!isAdmin && !getAllCategories) {
        parentConditions.active = true;

            // Aggregate to match the parent category and filter the subcategory and its children
     result = await category.aggregate([
        {
            $match: parentConditions // Match the parent category
        },
        {
            $project: {
                // Project only the required fields
                _id: 1,
                name: 1,
                children: {
                    $filter: {
                        input: "$children", // Array of children at this level
                        as: "child",
                        cond: {
                            $and: [
                                { $eq: ["$$child.name", subCategoryName] }, // Match the subcategory name
                                // { $or: [ 
                                // { $eq: [isAdmin, true] },
                                // { $eq: ["$$child.active", true] }] } // Filter by active only if not admin
                            ]
                        }
                    }
                }
            }
        },
        { 
            $unwind: "$children" // Unwind to get only the matching subcategory and its children
        }
    ]).exec();
    } else {
        // Aggregate to match the parent category and include all subcategories and their children
        result = await category.aggregate([
            {
                $match: parentConditions // Match the parent category
            },
            {
                $project: {
                    // Project only the required fields
                    _id: 1,
                    name: 1,
                    children: 1 // Include all children without filtering
                }
            }
        ]).exec();

    }



  //  if (!isAdmin && !getAllCategories) {
        result = result.map(parent => this.filterNonActiveChildren(parent));
  //  }

    return this.handlePagedResponse({ result, count: 0 }, res);
}

public async getSubCategory2(categoryName, subCategoryName, res, isAdmin) {

    let parentConditions:any = {
        name: categoryName,
        // active: true
    };

    // If not an admin and not getting all categories, only show active categories
    if (!isAdmin) {
        parentConditions.active = true;
    }

    // Aggregate to match the parent category and filter the subcategory and its children
    let result = await category.aggregate([
        {
            $match: parentConditions // Match the parent category
        },
        {
            $project: {
                // Project only the required fields
                _id: 1,
                name: 1,
                children: {
                    $filter: {
                        input: "$children", // Array of children at this level
                        as: "child",
                        cond: {
                            $and: [
                                { $eq: ["$$child.name", subCategoryName] }, // Match the subcategory name
                                // { $or: [ 
                                // { $eq: [isAdmin, true] },
                                // { $eq: ["$$child.active", true] }] } // Filter by active only if not admin
                            ]
                        }
                    }
                }
            }
        },
        { 
            $unwind: "$children" // Unwind to get only the matching subcategory and its children
        }
    ]).exec();

  //  if (!isAdmin && !getAllCategories) {
        result = result.map(parent => this.filterNonActiveChildren(parent));
  //  }

    return result; // this.handlePagedResponse({ result, count: 0 }, res);
}


    public async getNestedByCategory(idArr, res, isAdmin, getAllCategories, mainCategoryId, categoryId, category) {
        let parentConditions = {};
        if (isAdmin || getAllCategories) {
            parentConditions = idArr ? { _id: { $in: idArr } } : {};
        } else {
            parentConditions = idArr ? { _id: { $in: idArr }, active: true } : {};
        }
    
        // Aggregate to filter parent documents and their nested items
        let result = await category.aggregate([
            {
                $match: parentConditions
            },
            {
                $lookup: {
                    from: 'subcategories', // Replace with the actual collection name for subcategories
                    localField: '_id',
                    foreignField: 'parentCategoryId', // Replace with the actual field name for parent category reference
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
        if (req.query['category._id']) {
          const cat = 'category._id';      
          const catId =  req.query['category._id'];
          const o_id = new ObjectId(catId); 
          req.params = {'category._id': o_id};    
        } else if(req.query['category.name']) {
            const catName = 'category.name';
            const catNameValue = req.query['category.name'];
            req.params = {'category.name': catNameValue}
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
