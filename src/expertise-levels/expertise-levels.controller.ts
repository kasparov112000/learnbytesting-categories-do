import { Controller, Get, Post, Put, Delete, Param, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExpertiseLevelsService } from './expertise-levels.service';

@ApiTags('expertise-levels')
@Controller('expertise-levels')
export class ExpertiseLevelsController {
  private readonly logger = new Logger(ExpertiseLevelsController.name);

  constructor(private readonly service: ExpertiseLevelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get expertise levels by root category' })
  async getAll(@Query() query: any) {
    return this.service.getByRootCategory(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expertise level by ID' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an expertise level' })
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder expertise levels' })
  async reorder(@Body() body: any) {
    return this.service.reorder(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an expertise level' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expertise level' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
