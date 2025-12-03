import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BorrowingsService } from './borrowings.service';
import { CreateBorrowingDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';

@ApiTags('Borrowings')
@Controller('borrowings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BorrowingsController {
  constructor(private readonly borrowingsService: BorrowingsService) {}

  @Post()
  @ApiOperation({ summary: 'Borrow a book' })
  @ApiResponse({ status: 201, description: 'Book borrowed successfully' })
  @ApiResponse({ status: 400, description: 'Book not available or already borrowed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  borrow(
    @Body() createBorrowingDto: CreateBorrowingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.borrowingsService.borrow(user.id, createBorrowingDto);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Return a borrowed book' })
  @ApiResponse({ status: 200, description: 'Book returned successfully' })
  @ApiResponse({ status: 400, description: 'Book already returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Can only return own borrowings' })
  @ApiResponse({ status: 404, description: 'Borrowing not found' })
  returnBook(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.borrowingsService.returnBook(id, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user\'s borrowings' })
  @ApiResponse({ status: 200, description: 'List of user\'s borrowings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findMyBorrowings(@CurrentUser() user: { id: string }) {
    return this.borrowingsService.findMyBorrowings(user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all borrowings (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all borrowings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAll() {
    return this.borrowingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a borrowing by ID' })
  @ApiResponse({ status: 200, description: 'Borrowing details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Borrowing not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.borrowingsService.findOne(id);
  }
}
