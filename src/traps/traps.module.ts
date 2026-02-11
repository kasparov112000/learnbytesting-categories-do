import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrapsController } from './traps.controller';
import { TrapsService } from './traps.service';
import { TrapSchema } from './schemas/trap.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Trap', schema: TrapSchema }]),
  ],
  controllers: [TrapsController],
  providers: [TrapsService],
  exports: [TrapsService],
})
export class TrapsModule {}
