import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Books (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let testAuthorId: string;
  let testBookId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@library.com', password: 'admin123' });
    adminToken = adminResponse.body.access_token;

    // Create and login as regular user
    const testUserEmail = `booktest-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUserEmail,
        password: 'Test123!@#',
        name: 'Book Test User',
      });

    const userResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: 'Test123!@#' });
    userToken = userResponse.body.access_token;

    // Create test author
    const authorResponse = await request(app.getHttpServer())
      .post('/authors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Author', bio: 'Test bio' });
    testAuthorId = authorResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testBookId) {
      await prisma.book.deleteMany({ where: { id: testBookId } });
    }
    if (testAuthorId) {
      await prisma.author.deleteMany({ where: { id: testAuthorId } });
    }
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'booktest-' } },
    });
    await app.close();
  });

  describe('GET /books', () => {
    it('should return books without authentication (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?page=1&limit=5')
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by availability', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?available=true')
        .expect(200);

      response.body.data.forEach((book: any) => {
        expect(book.availableQty).toBeGreaterThan(0);
      });
    });

    it('should search by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/books?search=the')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /books (Admin only)', () => {
    const testBook = {
      title: 'Test Book Title',
      isbn: `TEST-${Date.now()}`,
      quantity: 5,
    };

    it('should create a book as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testBook, authorId: testAuthorId })
        .expect(201);

      testBookId = response.body.id;
      expect(response.body.title).toBe(testBook.title);
      expect(response.body.isbn).toBe(testBook.isbn);
      expect(response.body.quantity).toBe(testBook.quantity);
      expect(response.body.availableQty).toBe(testBook.quantity);
    });

    it('should fail to create book as regular user', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...testBook, isbn: 'ANOTHER-ISBN', authorId: testAuthorId })
        .expect(403);
    });

    it('should fail to create book without authentication', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .send({ ...testBook, isbn: 'ANOTHER-ISBN', authorId: testAuthorId })
        .expect(401);
    });

    it('should fail with duplicate ISBN', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testBook, authorId: testAuthorId })
        .expect(409);
    });

    it('should fail with non-existent author', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testBook,
          isbn: 'UNIQUE-ISBN-123',
          authorId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });
  });

  describe('GET /books/:id', () => {
    it('should return a single book', async () => {
      const response = await request(app.getHttpServer())
        .get(`/books/${testBookId}`)
        .expect(200);

      expect(response.body.id).toBe(testBookId);
      expect(response.body).toHaveProperty('author');
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .get('/books/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /books/:id (Admin only)', () => {
    it('should update a book as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/books/${testBookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Test Book' })
        .expect(200);

      expect(response.body.title).toBe('Updated Test Book');
    });

    it('should fail to update as regular user', async () => {
      await request(app.getHttpServer())
        .patch(`/books/${testBookId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('DELETE /books/:id (Admin only)', () => {
    it('should fail to delete as regular user', async () => {
      await request(app.getHttpServer())
        .delete(`/books/${testBookId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should delete a book as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/books/${testBookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      testBookId = ''; // Clear so cleanup doesn't fail
    });
  });
});
