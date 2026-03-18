import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpertiseLevelsController } from './expertise-levels.controller';
import { ExpertiseLevelsService } from './expertise-levels.service';
import { ExpertiseLevelSchema } from './schemas/expertise-level.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'ExpertiseLevel', schema: ExpertiseLevelSchema }]),
  ],
  controllers: [ExpertiseLevelsController],
  providers: [ExpertiseLevelsService],
  exports: [ExpertiseLevelsService],
})
export class ExpertiseLevelsModule {}
