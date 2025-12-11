import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // Cache for 5 minutes (300 seconds)
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
