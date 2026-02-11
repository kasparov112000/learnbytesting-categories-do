import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('healthcheck')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return { status: 'ok', service: 'categories', timestamp: new Date().toISOString() };
  }

  @Get('pingcategories')
  @ApiOperation({ summary: 'Ping categories service' })
  ping() {
    return { status: 'ok', message: 'Categories service is running' };
  }

  @Get('pingcategoriesdb')
  @ApiOperation({ summary: 'Ping categories database' })
  pingDb() {
    const dbState = this.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    return {
      status: dbState === 1 ? 'ok' : 'error',
      database: states[dbState] || 'unknown',
    };
  }
}
