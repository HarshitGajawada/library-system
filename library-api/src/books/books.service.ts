import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto, FilterBooksDto } from './dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.book.create({
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
  }

  async findAll(filters: FilterBooksDto) {
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

    return this.prisma.book.findMany({
      where,
      include: {
        author: true,
      },
      orderBy: { title: 'asc' },
    });
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

    // If quantity is being updated, adjust availableQty proportionally
    let availableQtyAdjustment = 0;
    if (updateBookDto.quantity !== undefined) {
      const quantityDiff = updateBookDto.quantity - existingBook.quantity;
      availableQtyAdjustment = quantityDiff;
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        ...updateBookDto,
        ...(availableQtyAdjustment !== 0 && {
          availableQty: {
            increment: availableQtyAdjustment,
          },
        }),
      },
      include: {
        author: true,
      },
    });
  }

  async remove(id: string) {
    // Check if book exists
    await this.findOne(id);

    return this.prisma.book.delete({
      where: { id },
    });
  }
}
