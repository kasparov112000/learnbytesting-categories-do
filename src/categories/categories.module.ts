import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryTreeService } from './category-tree.service';
import { CategoryGridService } from './category-grid.service';
import { CategorySchema } from './schemas/category.schema';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Categories', schema: CategorySchema }]),
    TranslationModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryTreeService, CategoryGridService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
