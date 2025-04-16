import { expect } from 'chai';
import { Category } from '../../models/category.model';

describe('Entity Model', () => {
  it('should create a category instance', () => {
    const category = new Category({});
    expect(category).to.be.instanceOf(Category);
  });
});
