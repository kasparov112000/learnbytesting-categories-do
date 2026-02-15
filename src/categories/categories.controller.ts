import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { CategoriesService } from './categories.service';
import { CategoryGridService } from './category-grid.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categoryGridService: CategoryGridService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories. Use ?all=true to include chess opening reference data.' })
  async getAll(@Query() query: Record<string, any>) {
    return this.categoriesService.getAll(query);
  }

  @Post('grid')
  @ApiOperation({ summary: 'Server-side grid data' })
  async grid(@Body() body: any, @Req() req: Request) {
    return this.categoryGridService.grid(body, req);
  }

  @Post('grid-flatten')
  @ApiOperation({ summary: 'Flatten category hierarchy for grid display' })
  async gridFlatten(@Body() body: any, @Req() req: Request) {
    return this.categoryGridService.gridFlatten(body, req);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search categories by name' })
  async search(@Body() body: any) {
    return this.categoryGridService.search(body.term || body.searchTerm);
  }

  @Get(':id/shallow-children')
  @ApiOperation({ summary: 'Get shallow children for lazy-loaded navigation (issue #80)' })
  async getShallowChildren(@Param('id') id: string) {
    return this.categoriesService.getShallowChildren(id);
  }

  @Get(':id/ai-config')
  @ApiOperation({ summary: 'Get resolved AI config for a category' })
  async getAiConfig(@Param('id') id: string) {
    return this.categoriesService.getCategoryWithResolvedAiConfig(id);
  }

  @Put(':id/ai-config')
  @ApiOperation({ summary: 'Update AI config for a category' })
  async updateAiConfig(@Param('id') id: string, @Body() body: any) {
    return this.categoriesService.updateCategoryAiConfig(id, body);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import category tree from JSON' })
  async importTree(@Body() body: any) {
    return this.categoriesService.importCategoryTree(body);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export category tree to JSON' })
  async exportTree() {
    return this.categoriesService.exportCategoryTree();
  }

  @Post('ensure-subcategory')
  @ApiOperation({ summary: 'Ensure subcategory exists (idempotent)' })
  async ensureSubcategory(@Body() body: any) {
    return this.categoriesService.ensureSubcategory(body);
  }

  @Get('translated')
  @ApiOperation({ summary: 'Get categories with translations' })
  async getTranslated(@Query('lang') lang: string) {
    return this.categoriesService.getCategoriesWithTranslation(lang);
  }

  @Post('translate-opening')
  @ApiOperation({ summary: 'Translate chess opening name' })
  async translateOpening(@Body() body: any) {
    return this.categoriesService.translateOpeningName(body.openingName, body.eco, body.targetLang);
  }

  @Post('sync/create')
  @ApiOperation({ summary: 'Sync create categories' })
  async syncCreate(@Body() body: any, @Req() req: Request) {
    return this.categoriesService.syncCreateCategories(body, req);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new category' })
  async create(@Body() body: any, @Req() req: Request) {
    return this.categoriesService.createCategory(body, req);
  }

  @Get('find/:id')
  @ApiOperation({ summary: 'Find category anywhere in the tree' })
  async findInTree(@Param('id') id: string) {
    return this.categoriesService.findCategoryInTree(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID (with children)' })
  async getById(@Param('id') id: string) {
    return this.categoriesService.getById(id);
  }

  @Post('query')
  @ApiOperation({ summary: 'Filter categories by query' })
  async getByCategory(@Body() body: any) {
    return this.categoriesService.getByCategory(body);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Get by line of service' })
  async getByLineOfService(@Param('id') id: string, @Body() body: any) {
    return this.categoriesService.getByLineOfService(id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.categoriesService.updateCategoryById(id, body, req);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
