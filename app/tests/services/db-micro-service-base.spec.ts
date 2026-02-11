import { ObjectId } from 'mongodb';

// Mock hipolito-models before importing the class under test
jest.mock('hipolito-models', () => {
  const MockApiResponse = jest.fn().mockImplementation(function (this: any, data?: any) {
    this.statusCode = 200;
    this.result = data;
    this.message = '';
    this.responseException = null;
  });

  const MockPagedApiResponse = jest.fn().mockImplementation(function (this: any, data?: any, count?: number) {
    this.statusCode = 200;
    this.result = data;
    this.count = count;
    this.message = '';
    this.responseException = null;
  });

  return {
    ApiResponse: MockApiResponse,
    PagedApiResponse: MockPagedApiResponse,
    MdrApplicationUser: jest.fn(),
    Category: jest.fn(),
    ApiResponseMessage: {
      exception: 'An exception occurred.',
      validationError: 'A validation error occurred.',
    },
    ApiError: jest.fn().mockImplementation(function (this: any, isError: boolean, message: string, stack?: string) {
      this.isError = isError;
      this.message = message;
      this.stack = stack;
      this.validationErrors = [];
    }),
    ApiValidationError: jest.fn().mockImplementation(function (this: any, init: any) {
      Object.assign(this, init);
    }),
  };
});

// Mock CategoryModel
jest.mock('../../models/category.model', () => ({
  CategoryModel: {
    aggregate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

import { DbMicroServiceBase } from '../../services/db-micro-service-base';

// Concrete subclass for testing since DbMicroServiceBase is abstract
class TestService extends DbMicroServiceBase {
  constructor(dbService: any) {
    super(dbService);
  }
}

describe('DbMicroServiceBase', () => {
  let mockDbService: any;
  let mockRes: any;
  let service: TestService;

  beforeEach(() => {
    mockDbService = {
      find: jest.fn().mockResolvedValue([]),
      findPaged: jest.fn().mockResolvedValue({ result: [], count: 0 }),
      findById: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    service = new TestService(mockDbService);

    // Suppress console.log/error noise during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------
  // get(req, res)
  // ---------------------------------------------------------------
  describe('get', () => {
    it('should call dbService.find and handleResponse when no paging query params', async () => {
      const mockData = [{ _id: '1', name: 'Category A' }];
      mockDbService.find.mockResolvedValue(mockData);

      const req = { query: {} };
      await service.get(req, mockRes);

      expect(mockDbService.find).toHaveBeenCalledWith(req);
      expect(mockDbService.findPaged).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call dbService.findPaged and handlePagedResponse when page and pageSize query params exist', async () => {
      const pagedResult = { result: [{ _id: '1' }], count: 1 };
      mockDbService.findPaged.mockResolvedValue(pagedResult);

      const req = { query: { page: '1', pageSize: '10' } };
      await service.get(req, mockRes);

      expect(mockDbService.findPaged).toHaveBeenCalledWith(req);
      expect(mockDbService.find).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call handleErrorResponse when dbService.find throws', async () => {
      const error = new Error('Database error');
      mockDbService.find.mockRejectedValue(error);

      const req = { query: {} };
      await service.get(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call handleErrorResponse when dbService.findPaged throws', async () => {
      const error = new Error('Paged query error');
      mockDbService.findPaged.mockRejectedValue(error);

      const req = { query: { page: '1', pageSize: '10' } };
      await service.get(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should not call findPaged when only page is provided (no pageSize)', async () => {
      const req = { query: { page: '1' } };
      await service.get(req, mockRes);

      expect(mockDbService.find).toHaveBeenCalledWith(req);
      expect(mockDbService.findPaged).not.toHaveBeenCalled();
    });

    it('should not call findPaged when only pageSize is provided (no page)', async () => {
      const req = { query: { pageSize: '10' } };
      await service.get(req, mockRes);

      expect(mockDbService.find).toHaveBeenCalledWith(req);
      expect(mockDbService.findPaged).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // getById(req, res)
  // ---------------------------------------------------------------
  describe('getById', () => {
    it('should call dbService.findById with the correct id', async () => {
      const mockData = { _id: 'abc123', name: 'Test' };
      mockDbService.findById.mockResolvedValue(mockData);

      const req = { params: { id: 'abc123' } };
      await service.getById(req, mockRes);

      expect(mockDbService.findById).toHaveBeenCalledWith('abc123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call handleErrorResponse when params is missing', async () => {
      const req = {};
      await service.getById(req, mockRes);

      expect(mockDbService.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call handleErrorResponse when params.id is missing', async () => {
      const req = { params: {} };
      await service.getById(req, mockRes);

      expect(mockDbService.findById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call handleErrorResponse when dbService.findById throws', async () => {
      mockDbService.findById.mockRejectedValue(new Error('Not found'));

      const req = { params: { id: 'nonexistent' } };
      await service.getById(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // post(req, res)
  // ---------------------------------------------------------------
  describe('post', () => {
    it('should call onPrePost and dbService.create with the request body', async () => {
      const body = { name: 'New Category' };
      const req = { body };
      const createdDoc = { _id: 'generated-id', name: 'New Category' };
      mockDbService.create.mockResolvedValue(createdDoc);

      await service.post(req, mockRes);

      expect(mockDbService.create).toHaveBeenCalledWith(body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should set _id if not provided via onPrePost', async () => {
      const body = { name: 'Category Without ID' };
      const req = { body };
      mockDbService.create.mockResolvedValue(body);

      await service.post(req, mockRes);

      expect(body).toHaveProperty('_id');
      expect(typeof (body as any)._id).toBe('string');
      expect((body as any)._id.length).toBeGreaterThan(0);
    });

    it('should not overwrite existing _id via onPrePost', async () => {
      const body = { _id: 'my-custom-id', name: 'Category With ID' };
      const req = { body };
      mockDbService.create.mockResolvedValue(body);

      await service.post(req, mockRes);

      expect((body as any)._id).toBe('my-custom-id');
    });

    it('should set createdByGuid from user.authenticatedInfo.guid', async () => {
      const body = {
        name: 'New Category',
        user: { authenticatedInfo: { guid: 'user-guid-123' } },
      };
      const req = { body };
      mockDbService.create.mockResolvedValue(body);

      await service.post(req, mockRes);

      expect((body as any).createdByGuid).toBe('user-guid-123');
      expect((body as any).modifiedByGuid).toBe('user-guid-123');
    });

    it('should set createdByGuid to SYSTEM when no user info present', async () => {
      const body = { name: 'Category' };
      const req = { body };
      mockDbService.create.mockResolvedValue(body);

      await service.post(req, mockRes);

      expect((body as any).createdByGuid).toBe('SYSTEM');
      expect((body as any).modifiedByGuid).toBe('SYSTEM');
    });

    it('should set createdDate and modifiedDate as Date objects', async () => {
      const body = { name: 'Category' };
      const req = { body };
      mockDbService.create.mockResolvedValue(body);

      const beforeTime = new Date();
      await service.post(req, mockRes);
      const afterTime = new Date();

      expect((body as any).createdDate).toBeInstanceOf(Date);
      expect((body as any).modifiedDate).toBeInstanceOf(Date);
      expect((body as any).createdDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect((body as any).createdDate.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should call handleErrorResponse when dbService.create throws', async () => {
      mockDbService.create.mockRejectedValue(new Error('Create failed'));

      const req = { body: { name: 'Bad Category' } };
      await service.post(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // put(req, res)
  // ---------------------------------------------------------------
  describe('put', () => {
    it('should call onPrePut and dbService.update with the full request', async () => {
      const req = {
        params: { id: '123' },
        body: {
          name: 'Updated',
          currentUser: { info: { guid: 'user-guid-456' } },
        },
      };
      mockDbService.update.mockResolvedValue({ _id: '123', name: 'Updated' });

      await service.put(req, mockRes);

      expect(mockDbService.update).toHaveBeenCalledWith(req);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should set modifiedDate and modifiedByGuid from currentUser.info.guid', async () => {
      const req: any = {
        params: { id: '123' },
        body: {
          name: 'Updated',
          currentUser: { info: { guid: 'user-guid-456' } },
        },
      };
      mockDbService.update.mockResolvedValue({});

      await service.put(req, mockRes);

      expect(req.body.modifiedByGuid).toBe('user-guid-456');
      expect(req.body.modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid to SYSTEM when no currentUser', async () => {
      const req = {
        params: { id: '123' },
        body: { name: 'Updated' },
      };
      mockDbService.update.mockResolvedValue({});

      await service.put(req, mockRes);

      expect((req.body as any).modifiedByGuid).toBe('SYSTEM');
      expect((req.body as any).modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid to SYSTEM when currentUser has no info', async () => {
      const req = {
        params: { id: '123' },
        body: { name: 'Updated', currentUser: {} },
      };
      mockDbService.update.mockResolvedValue({});

      await service.put(req, mockRes);

      expect((req.body as any).modifiedByGuid).toBe('SYSTEM');
    });

    it('should call handleErrorResponse when dbService.update throws', async () => {
      mockDbService.update.mockRejectedValue(new Error('Update failed'));

      const req = { params: { id: '123' }, body: { name: 'Fail' } };
      await service.put(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // patch(req, res)
  // ---------------------------------------------------------------
  describe('patch', () => {
    // NOTE: patch() calls onPrePatch(req.body), and onPrePatch accesses req.body.currentUser
    // (where req = the outer req.body). So req.body must have a nested .body property
    // for onPrePatch to work correctly. This is the actual code behavior.

    it('should call onPrePatch and dbService.update with the request body', async () => {
      const body: any = {
        name: 'Patched',
        body: { currentUser: null },
      };
      const req = { body };
      mockDbService.update.mockResolvedValue({ name: 'Patched' });

      await service.patch(req, mockRes);

      expect(mockDbService.update).toHaveBeenCalledWith(body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should set modifiedDate and modifiedByGuid via onPrePatch when body.body.currentUser exists', async () => {
      const body: any = {
        name: 'Patched',
        body: {
          currentUser: { info: { guid: 'patch-user-guid' } },
        },
      };
      const req = { body };
      mockDbService.update.mockResolvedValue({});

      await service.patch(req, mockRes);

      // onPrePatch sets req.body.modifiedByGuid where req = outer body
      // so it sets body.body.modifiedByGuid
      expect(body.body.modifiedByGuid).toBe('patch-user-guid');
      expect(body.body.modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid to SYSTEM when body.body has no currentUser', async () => {
      const body: any = {
        name: 'Patched',
        body: {},
      };
      const req = { body };
      mockDbService.update.mockResolvedValue({});

      await service.patch(req, mockRes);

      expect(body.body.modifiedByGuid).toBe('SYSTEM');
    });

    it('should call handleErrorResponse when dbService.update throws in patch', async () => {
      mockDbService.update.mockRejectedValue(new Error('Patch failed'));

      const req = { body: { name: 'Bad Patch', body: {} } };
      await service.patch(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // delete(req, res)
  // ---------------------------------------------------------------
  describe('delete', () => {
    it('should call dbService.delete with the request and respond', async () => {
      const req = { params: { id: 'del-123' } };
      mockDbService.delete.mockResolvedValue({ deletedCount: 1 });

      await service.delete(req, mockRes);

      expect(mockDbService.delete).toHaveBeenCalledWith(req);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should call handleErrorResponse when dbService.delete throws', async () => {
      mockDbService.delete.mockRejectedValue(new Error('Delete failed'));

      const req = { params: { id: 'del-123' } };
      await service.delete(req, mockRes);

      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // filterNonActiveChildren(parent)
  // ---------------------------------------------------------------
  describe('filterNonActiveChildren', () => {
    it('should return parent unchanged when it has no children property', () => {
      const parent = { _id: '1', name: 'No children' };
      const result = service.filterNonActiveChildren(parent);

      expect(result).toBe(parent);
      expect(result).toEqual({ _id: '1', name: 'No children' });
    });

    it('should return parent unchanged when children is not an array', () => {
      const parent = { _id: '1', name: 'Non-array children', children: 'not-an-array' };
      const result = service.filterNonActiveChildren(parent);

      expect(result.children).toBe('not-an-array');
    });

    it('should filter out inactive children', () => {
      const parent = {
        _id: '1',
        name: 'Parent',
        children: [
          { _id: 'c1', name: 'Active Child', active: true },
          { _id: 'c2', name: 'Inactive Child', active: false },
          { _id: 'c3', name: 'Another Active', active: true },
        ],
      };

      const result = service.filterNonActiveChildren(parent);

      expect(result.children).toHaveLength(2);
      expect(result.children[0].name).toBe('Active Child');
      expect(result.children[1].name).toBe('Another Active');
    });

    it('should filter out children with falsy active value (undefined, null, 0)', () => {
      const parent = {
        _id: '1',
        name: 'Parent',
        children: [
          { _id: 'c1', name: 'Active', active: true },
          { _id: 'c2', name: 'Undefined active', active: undefined },
          { _id: 'c3', name: 'Null active', active: null },
          { _id: 'c4', name: 'Zero active', active: 0 },
          { _id: 'c5', name: 'No active property' },
        ],
      };

      const result = service.filterNonActiveChildren(parent);

      expect(result.children).toHaveLength(1);
      expect(result.children[0].name).toBe('Active');
    });

    it('should recursively filter inactive children in nested structures', () => {
      const parent = {
        _id: '1',
        name: 'Root',
        children: [
          {
            _id: 'c1',
            name: 'Level 1 Active',
            active: true,
            children: [
              { _id: 'c1a', name: 'Level 2 Active', active: true },
              { _id: 'c1b', name: 'Level 2 Inactive', active: false },
            ],
          },
          {
            _id: 'c2',
            name: 'Level 1 Also Active',
            active: true,
            children: [
              { _id: 'c2a', name: 'Level 2 Active', active: true },
            ],
          },
        ],
      };

      const result = service.filterNonActiveChildren(parent);

      expect(result.children).toHaveLength(2);
      expect(result.children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].name).toBe('Level 2 Active');
      expect(result.children[1].children).toHaveLength(1);
    });

    it('should handle deeply nested filtering (3+ levels)', () => {
      const parent = {
        _id: '1',
        name: 'Root',
        children: [
          {
            _id: 'c1',
            name: 'L1',
            active: true,
            children: [
              {
                _id: 'c1a',
                name: 'L2',
                active: true,
                children: [
                  { _id: 'c1a1', name: 'L3 Active', active: true },
                  { _id: 'c1a2', name: 'L3 Inactive', active: false },
                ],
              },
            ],
          },
        ],
      };

      const result = service.filterNonActiveChildren(parent);

      expect(result.children[0].children[0].children).toHaveLength(1);
      expect(result.children[0].children[0].children[0].name).toBe('L3 Active');
    });

    it('should handle empty children array', () => {
      const parent = { _id: '1', name: 'Parent', children: [] };
      const result = service.filterNonActiveChildren(parent);

      expect(result.children).toEqual([]);
    });

    it('should remove all children if none are active', () => {
      const parent = {
        _id: '1',
        name: 'Parent',
        children: [
          { _id: 'c1', name: 'Inactive 1', active: false },
          { _id: 'c2', name: 'Inactive 2', active: false },
        ],
      };

      const result = service.filterNonActiveChildren(parent);

      expect(result.children).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // getCurrentUser(req)
  // ---------------------------------------------------------------
  describe('getCurrentUser', () => {
    it('should return the currentUser from req.body', async () => {
      const currentUser = { info: { guid: 'user-123' }, name: 'Test User' };
      const req = { body: { currentUser } };

      const result = await (service as any).getCurrentUser(req);

      expect(result).toBe(currentUser);
    });

    it('should throw UnauthorizedException when currentUser is missing', async () => {
      const req = { body: {} };

      await expect((service as any).getCurrentUser(req)).rejects.toThrow(
        'No user was provided as part of the request. currentUser is required when filtering based on the current user.'
      );
    });

    it('should throw UnauthorizedException when currentUser is null', async () => {
      const req = { body: { currentUser: null } };

      await expect((service as any).getCurrentUser(req)).rejects.toThrow();
    });

    it('should throw UnauthorizedException when currentUser is undefined', async () => {
      const req = { body: { currentUser: undefined } };

      await expect((service as any).getCurrentUser(req)).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------
  // handleErrorResponse(error, res)
  // ---------------------------------------------------------------
  describe('handleErrorResponse', () => {
    it('should handle ValidationError with status 400', () => {
      const error = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          name: { path: 'name', kind: 'required', message: 'Name is required' },
        },
      };

      (service as any).handleErrorResponse(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle UnauthorizedException with status 401', () => {
      const error = { name: 'UnauthorizedException', message: 'Unauthorized' };

      (service as any).handleErrorResponse(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle NotFoundException with status 404', () => {
      const error = { name: 'NotFoundException', message: 'Not found' };

      (service as any).handleErrorResponse(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle unknown errors with status 500 (default)', () => {
      const error = new Error('Something unexpected');

      (service as any).handleErrorResponse(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle errors with custom name that is not recognized', () => {
      const error = { name: 'CustomError', message: 'Custom', stack: '' };

      (service as any).handleErrorResponse(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // handleResponse(result, res)
  // ---------------------------------------------------------------
  describe('handleResponse', () => {
    it('should create an ApiResponse and send it with status 200', () => {
      const data = [{ _id: '1', name: 'Item' }];

      (service as any).handleResponse(data, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle null result', () => {
      (service as any).handleResponse(null, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle empty array result', () => {
      (service as any).handleResponse([], mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // handlePagedResponse(result, res)
  // ---------------------------------------------------------------
  describe('handlePagedResponse', () => {
    it('should create a PagedApiResponse and send it with status 200', () => {
      const pagedResult = { result: [{ _id: '1' }], count: 1 };

      (service as any).handlePagedResponse(pagedResult, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle empty paged result', () => {
      const pagedResult = { result: [], count: 0 };

      (service as any).handlePagedResponse(pagedResult, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // onPrePost(model) - tested directly
  // ---------------------------------------------------------------
  describe('onPrePost', () => {
    it('should generate a new _id when model does not have one', () => {
      const model: any = { name: 'Test' };

      (service as any).onPrePost(model);

      expect(model._id).toBeDefined();
      expect(typeof model._id).toBe('string');
      expect(model._id.length).toBe(24); // ObjectId hex string length
    });

    it('should not overwrite existing _id', () => {
      const model: any = { _id: 'existing-id', name: 'Test' };

      (service as any).onPrePost(model);

      expect(model._id).toBe('existing-id');
    });

    it('should set createdByGuid from user.authenticatedInfo.guid', () => {
      const model: any = {
        name: 'Test',
        user: { authenticatedInfo: { guid: 'my-guid' } },
      };

      (service as any).onPrePost(model);

      expect(model.createdByGuid).toBe('my-guid');
    });

    it('should set createdByGuid to SYSTEM when user is missing', () => {
      const model: any = { name: 'Test' };

      (service as any).onPrePost(model);

      expect(model.createdByGuid).toBe('SYSTEM');
    });

    it('should set createdByGuid to SYSTEM when user has no authenticatedInfo', () => {
      const model: any = { name: 'Test', user: {} };

      (service as any).onPrePost(model);

      expect(model.createdByGuid).toBe('SYSTEM');
    });

    it('should set createdDate as a Date', () => {
      const model: any = { name: 'Test' };
      const before = new Date();

      (service as any).onPrePost(model);

      const after = new Date();
      expect(model.createdDate).toBeInstanceOf(Date);
      expect(model.createdDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(model.createdDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set modifiedDate as a Date', () => {
      const model: any = { name: 'Test' };

      (service as any).onPrePost(model);

      expect(model.modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid matching createdByGuid', () => {
      const model: any = {
        name: 'Test',
        user: { authenticatedInfo: { guid: 'user-x' } },
      };

      (service as any).onPrePost(model);

      expect(model.modifiedByGuid).toBe('user-x');
      expect(model.modifiedByGuid).toBe(model.createdByGuid);
    });
  });

  // ---------------------------------------------------------------
  // onPrePut(req) - tested directly
  // ---------------------------------------------------------------
  describe('onPrePut', () => {
    it('should set modifiedDate on req.body', () => {
      const req = { body: { name: 'Updated' } };

      (service as any).onPrePut(req);

      expect((req.body as any).modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid from currentUser.info.guid', () => {
      const req = {
        body: {
          name: 'Updated',
          currentUser: { info: { guid: 'put-user-guid' } },
        },
      };

      (service as any).onPrePut(req);

      expect((req.body as any).modifiedByGuid).toBe('put-user-guid');
    });

    it('should set modifiedByGuid to SYSTEM when currentUser is missing', () => {
      const req = { body: { name: 'Updated' } };

      (service as any).onPrePut(req);

      expect((req.body as any).modifiedByGuid).toBe('SYSTEM');
    });

    it('should set modifiedByGuid to SYSTEM when currentUser.info is missing', () => {
      const req = { body: { name: 'Updated', currentUser: {} } };

      (service as any).onPrePut(req);

      expect((req.body as any).modifiedByGuid).toBe('SYSTEM');
    });

    it('should set modifiedByGuid to SYSTEM when currentUser is null', () => {
      const req = { body: { name: 'Updated', currentUser: null } };

      (service as any).onPrePut(req);

      expect((req.body as any).modifiedByGuid).toBe('SYSTEM');
    });
  });

  // ---------------------------------------------------------------
  // onPrePatch(req) - tested directly (mirrors onPrePut but on req.body directly)
  // ---------------------------------------------------------------
  describe('onPrePatch', () => {
    // onPrePatch accesses req.body.currentUser, req.body.modifiedDate, req.body.modifiedByGuid
    // So the argument must have a .body property.

    it('should set modifiedDate on req.body', () => {
      const req: any = { body: { name: 'Patched' } };

      (service as any).onPrePatch(req);

      expect(req.body.modifiedDate).toBeInstanceOf(Date);
    });

    it('should set modifiedByGuid from req.body.currentUser.info.guid', () => {
      const req: any = {
        body: {
          name: 'Patched',
          currentUser: { info: { guid: 'patch-guid' } },
        },
      };

      (service as any).onPrePatch(req);

      expect(req.body.modifiedByGuid).toBe('patch-guid');
    });

    it('should set modifiedByGuid to SYSTEM when no currentUser in body', () => {
      const req: any = { body: { name: 'Patched' } };

      (service as any).onPrePatch(req);

      expect(req.body.modifiedByGuid).toBe('SYSTEM');
    });
  });

  // ---------------------------------------------------------------
  // formatSearch(req)
  // ---------------------------------------------------------------
  describe('formatSearch', () => {
    it('should set req.params from Category._id query param', () => {
      const req: any = { query: { 'Category._id': 'cat-123' }, params: {} };

      service.formatSearch(req);

      expect(req.params['Category._id']).toBe('cat-123');
    });

    it('should set req.params from Category.name query param', () => {
      const req: any = { query: { 'Category.name': 'Chess' }, params: {} };

      service.formatSearch(req);

      expect(req.params['Category.name']).toBe('Chess');
    });

    it('should prioritize Category._id over Category.name when both present', () => {
      const req: any = {
        query: { 'Category._id': 'cat-123', 'Category.name': 'Chess' },
        params: {},
      };

      service.formatSearch(req);

      expect(req.params['Category._id']).toBe('cat-123');
      expect(req.params['Category.name']).toBeUndefined();
    });

    it('should not modify params when neither Category._id nor Category.name is present', () => {
      const req: any = { query: { someOtherParam: 'value' }, params: { original: true } };

      service.formatSearch(req);

      expect(req.params.original).toBe(true);
      expect(req.params['Category._id']).toBeUndefined();
      expect(req.params['Category.name']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------
  // Integration-style tests: full flow through methods
  // ---------------------------------------------------------------
  describe('integration: post -> put flow', () => {
    it('should set creation fields in post and update fields in put', async () => {
      const body: any = {
        name: 'New Item',
        user: { authenticatedInfo: { guid: 'creator-guid' } },
      };
      const req = { body };
      mockDbService.create.mockResolvedValue(body);

      await service.post(req, mockRes);

      // Verify creation fields
      expect(body.createdByGuid).toBe('creator-guid');
      expect(body.createdDate).toBeInstanceOf(Date);
      expect(body._id).toBeDefined();

      // Now simulate a put with a different user
      const putReq = {
        params: { id: body._id },
        body: {
          ...body,
          name: 'Updated Item',
          currentUser: { info: { guid: 'updater-guid' } },
        },
      };
      mockDbService.update.mockResolvedValue(putReq.body);

      await service.put(putReq, mockRes);

      expect(putReq.body.modifiedByGuid).toBe('updater-guid');
      expect(putReq.body.modifiedDate).toBeInstanceOf(Date);
      // createdByGuid should still be from the original creation
      expect(putReq.body.createdByGuid).toBe('creator-guid');
    });
  });
});
