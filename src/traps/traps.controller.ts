import { Controller, Get, Post, Put, Delete, Param, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TrapsService } from './traps.service';

@ApiTags('traps')
@Controller('traps')
export class TrapsController {
  private readonly logger = new Logger(TrapsController.name);

  constructor(private readonly trapsService: TrapsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all traps with optional filters' })
  async getAll(@Query() query: any) {
    return this.trapsService.getAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get trap statistics' })
  async getStats() {
    return this.trapsService.getStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search traps' })
  async search(@Query('q') q: string, @Query('limit') limit?: number) {
    return this.trapsService.search(q, limit);
  }

  @Get('fen')
  @ApiOperation({ summary: 'Find traps by FEN position' })
  async findByFen(@Query('fen') fen: string, @Query('matchType') matchType?: string) {
    return this.trapsService.findByFen(fen, matchType);
  }

  @Get('eco/:eco')
  @ApiOperation({ summary: 'Find traps by ECO code' })
  async findByEco(@Param('eco') eco: string) {
    return this.trapsService.findByEco(eco);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Find traps by category ID' })
  async findByCategoryId(@Param('categoryId') categoryId: string) {
    return this.trapsService.findByCategoryId(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trap by ID' })
  async getById(@Param('id') id: string) {
    return this.trapsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trap' })
  async create(@Body() body: any) {
    return this.trapsService.create(body);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import traps' })
  async bulkImport(@Body() body: any) {
    return this.trapsService.bulkImport(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a trap' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.trapsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a trap' })
  async delete(@Param('id') id: string, @Query('permanent') permanent?: string) {
    return this.trapsService.delete(id, permanent === 'true');
  }
}
