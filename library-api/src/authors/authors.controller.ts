import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { AuthorsService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Public, Roles } from '../auth/decorators';

@ApiTags('Authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new author (Admin only)' })
  @ApiResponse({ status: 201, description: 'Author created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all authors' })
  @ApiResponse({ status: 200, description: 'List of all authors' })
  findAll() {
    return this.authorsService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get an author by ID' })
  @ApiResponse({ status: 200, description: 'Author details with their books' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.authorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an author (Admin only)' })
  @ApiResponse({ status: 200, description: 'Author updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an author (Admin only)' })
  @ApiResponse({ status: 200, description: 'Author deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.authorsService.remove(id);
  }
}
