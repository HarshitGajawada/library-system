import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, FilterBooksDto } from './dto';
import { PaginatedResponseDto } from '../common/dto';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createBookDto: CreateBookDto) {
    const { title, isbn, authorId, quantity } = createBookDto;

    // Check if ISBN already exists
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      throw new ConflictException('A book with this ISBN already exists');
    }

    // Check if author exists
    const author = await this.prisma.author.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${authorId} not found`);
    }

    const book = await this.prisma.book.create({
      data: {
        title,
        isbn,
        authorId,
        quantity,
        availableQty: quantity, // Initially all copies are available
      },
      include: {
        author: true,
      },
    });

    return book;
  }

  async findAll(filters: FilterBooksDto, page: number = 1, limit: number = 10) {
    const { authorId, available, search } = filters;

    const where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (available === true) {
      where.availableQty = { gt: 0 };
    } else if (available === false) {
      where.availableQty = 0;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        include: {
          author: true,
        },
        orderBy: { title: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.book.count({ where }),
    ]);

    return new PaginatedResponseDto(books, total, page, limit);
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
        borrowings: {
          where: {
            status: 'BORROWED',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    // Check if book exists
    const existingBook = await this.findOne(id);

    // If ISBN is being updated, check for conflicts
    if (updateBookDto.isbn && updateBookDto.isbn !== existingBook.isbn) {
      const bookWithIsbn = await this.prisma.book.findUnique({
        where: { isbn: updateBookDto.isbn },
      });

      if (bookWithIsbn) {
        throw new ConflictException('A book with this ISBN already exists');
      }
    }

    // If authorId is being updated, verify the author exists
    if (updateBookDto.authorId) {
      const author = await this.prisma.author.findUnique({
        where: { id: updateBookDto.authorId },
      });

      if (!author) {
        throw new NotFoundException(
          `Author with ID ${updateBookDto.authorId} not found`,
        );
      }
    }

    // Calculate the final values
    const newQuantity = updateBookDto.quantity ?? existingBook.quantity;
    let newAvailableQty: number;

    if (updateBookDto.availableQty !== undefined) {
      // Admin explicitly set availableQty (e.g., for lost books)
      newAvailableQty = updateBookDto.availableQty;
    } else if (updateBookDto.quantity !== undefined) {
      // Only quantity changed, adjust availableQty proportionally
      const quantityDiff = updateBookDto.quantity - existingBook.quantity;
      newAvailableQty = existingBook.availableQty + quantityDiff;
    } else {
      // Neither changed
      newAvailableQty = existingBook.availableQty;
    }

    // Validate: availableQty cannot exceed quantity
    if (newAvailableQty > newQuantity) {
      throw new ConflictException(
        `Available quantity (${newAvailableQty}) cannot exceed total quantity (${newQuantity})`,
      );
    }

    // Validate: availableQty cannot be negative
    if (newAvailableQty < 0) {
      throw new ConflictException('Available quantity cannot be negative');
    }

    const updatedBook = await this.prisma.book.update({
      where: { id },
      data: {
        title: updateBookDto.title,
        isbn: updateBookDto.isbn,
        authorId: updateBookDto.authorId,
        quantity: newQuantity,
        availableQty: newAvailableQty,
      },
      include: {
        author: true,
      },
    });

    return updatedBook;
  }

  async remove(id: string) {
    // Check if book exists
    const book = await this.findOne(id);

    // Check for active borrowings
    const activeBorrowings = await this.prisma.borrowing.count({
      where: {
        bookId: id,
        status: 'BORROWED',
      },
    });

    if (activeBorrowings > 0) {
      throw new ConflictException(
        `Cannot delete book. There are ${activeBorrowings} active borrowing(s). Please wait for all copies to be returned.`,
      );
    }

    const deletedBook = await this.prisma.book.delete({
      where: { id },
    });

    return deletedBook;
  }
}
