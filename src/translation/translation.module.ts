import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TranslationService } from './translation.service';

@Module({
  imports: [HttpModule],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
