import { CategoryService } from '../../services/category.service';

// Mock uuid and crypto for CategoryService
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-12345')
}));
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-crypto-uuid-12345')
}));

describe('Entityless Service', () => {
  it('should create service instance', () => {
    const service = new CategoryService({});
    expect(service).toBeInstanceOf(CategoryService);
  });
});
