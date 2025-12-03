import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { BorrowingsModule } from './borrowings/borrowings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    AuthorsModule,
    BooksModule,
    UsersModule,
    BorrowingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
