import * as mongoose from 'mongoose';
import { CategorySchema } from '@mdr/schemas';

function addChildCategory(categoryModel, category, fieldName) {
  if (category[fieldName] && category[fieldName].length) {
    const newObjs = [];

    category[fieldName].forEach((d) => {
      newObjs.push(addChildCategory(categoryModel, d, fieldName));
    });

    category[fieldName] = newObjs;
  }

  return new categoryModel(category);
}



const category = mongoose.model('Categories', CategorySchema);

CategorySchema.pre('save', function (next) {
  if (this.isNew) {
    addChildCategory(category, this, 'children');
  }

  next();
});

export { category };