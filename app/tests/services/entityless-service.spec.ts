import { expect } from 'chai';
import { CategoryService } from '../../services/category.service';

describe('Entityless Service', () => {
  it('should create service instance', () => {
    const service = new CategoryService({});
    expect(service).to.be.instanceOf(CategoryService);
  });
});
