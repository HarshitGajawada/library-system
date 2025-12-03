import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBorrowingDto } from './dto';
import { BorrowStatus, Role } from '@prisma/client';

// TODO: Future enhancement - allow configurable borrowing duration per-book or per-user
const BORROWING_DURATION_DAYS = 14;

@Injectable()
export class BorrowingsService {
  constructor(private prisma: PrismaService) {}

  async borrow(userId: string, createBorrowingDto: CreateBorrowingDto) {
    const { bookId } = createBorrowingDto;

    // Check if book exists and has available copies
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    if (book.availableQty <= 0) {
      throw new BadRequestException(
        'This book is currently not available for borrowing',
      );
    }

    // Check if user already has an active borrowing for this book
    const existingBorrowing = await this.prisma.borrowing.findFirst({
      where: {
        userId,
        bookId,
        status: BorrowStatus.BORROWED,
      },
    });

    if (existingBorrowing) {
      throw new BadRequestException(
        'You already have an active borrowing for this book',
      );
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROWING_DURATION_DAYS);

    // Create borrowing and decrement available quantity in a transaction
    const [borrowing] = await this.prisma.$transaction([
      this.prisma.borrowing.create({
        data: {
          userId,
          bookId,
          dueDate,
        },
        include: {
          book: {
            include: {
              author: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.book.update({
        where: { id: bookId },
        data: {
          availableQty: {
            decrement: 1,
          },
        },
      }),
    ]);

    return borrowing;
  }

  async returnBook(
    borrowingId: string,
    currentUser: { id: string; role: string },
  ) {
    // Find the borrowing
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id: borrowingId },
      include: {
        book: true,
      },
    });

    if (!borrowing) {
      throw new NotFoundException(`Borrowing with ID ${borrowingId} not found`);
    }

    // Check if already returned
    if (borrowing.status === BorrowStatus.RETURNED) {
      throw new BadRequestException('This book has already been returned');
    }

    // Check ownership (unless admin)
    if (currentUser.role !== Role.ADMIN && borrowing.userId !== currentUser.id) {
      throw new ForbiddenException('You can only return your own borrowings');
    }

    // Update borrowing and increment available quantity in a transaction
    const [updatedBorrowing] = await this.prisma.$transaction([
      this.prisma.borrowing.update({
        where: { id: borrowingId },
        data: {
          returnDate: new Date(),
          status: BorrowStatus.RETURNED,
        },
        include: {
          book: {
            include: {
              author: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.book.update({
        where: { id: borrowing.bookId },
        data: {
          availableQty: {
            increment: 1,
          },
        },
      }),
    ]);

    return updatedBorrowing;
  }

  async findMyBorrowings(userId: string) {
    return this.prisma.borrowing.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            author: true,
          },
        },
      },
      orderBy: { borrowDate: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.borrowing.findMany({
      include: {
        book: {
          include: {
            author: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { borrowDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id },
      include: {
        book: {
          include: {
            author: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!borrowing) {
      throw new NotFoundException(`Borrowing with ID ${id} not found`);
    }

    return borrowing;
  }
}
