import { Module } from '@nestjs/common';
import { BorrowingsService } from './borrowings.service';
import { BorrowingsController } from './borrowings.controller';

@Module({
  controllers: [BorrowingsController],
  providers: [BorrowingsService],
  exports: [BorrowingsService],
})
export class BorrowingsModule {}
