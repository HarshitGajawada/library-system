import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Borrowings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;
  let testBookId: string;
  let testBorrowingId: string;

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
    const testUserEmail = `borrowtest-${Date.now()}@example.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUserEmail,
        password: 'Test123!@#',
        name: 'Borrow Test User',
      });
    testUserId = registerResponse.body.user.id;

    const userResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: 'Test123!@#' });
    userToken = userResponse.body.access_token;

    // Create test author and book for borrowing tests
    const authorResponse = await request(app.getHttpServer())
      .post('/authors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Borrowing Test Author', bio: 'Test bio' });

    const bookResponse = await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Borrowable Test Book',
        isbn: `BORROW-${Date.now()}`,
        authorId: authorResponse.body.id,
        quantity: 3,
      });
    testBookId = bookResponse.body.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.borrowing.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.book.deleteMany({
      where: { id: testBookId },
    });
    await prisma.author.deleteMany({
      where: { name: 'Borrowing Test Author' },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'borrowtest-' } },
    });
    await app.close();
  });

  describe('POST /borrowings (Borrow a book)', () => {
    it('should borrow a book successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/borrowings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: testBookId })
        .expect(201);

      testBorrowingId = response.body.id;
      expect(response.body.status).toBe('BORROWED');
      expect(response.body.book.id).toBe(testBookId);
      expect(response.body).toHaveProperty('dueDate');
    });

    it('should fail to borrow the same book again', async () => {
      await request(app.getHttpServer())
        .post('/borrowings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: testBookId })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/borrowings')
        .send({ bookId: testBookId })
        .expect(401);
    });

    it('should fail with non-existent book', async () => {
      await request(app.getHttpServer())
        .post('/borrowings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });
  });

  describe('GET /borrowings/my (Get user borrowings)', () => {
    it('should return user borrowings', async () => {
      const response = await request(app.getHttpServer())
        .get('/borrowings/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('book');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/borrowings/my')
        .expect(401);
    });
  });

  describe('GET /borrowings (Admin only)', () => {
    it('should return all borrowings as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/borrowings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail as regular user', async () => {
      await request(app.getHttpServer())
        .get('/borrowings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PATCH /borrowings/:id/return (Return a book)', () => {
    it('should return a borrowed book successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/borrowings/${testBorrowingId}/return`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.status).toBe('RETURNED');
      expect(response.body).toHaveProperty('returnDate');
    });

    it('should fail to return already returned book', async () => {
      await request(app.getHttpServer())
        .patch(`/borrowings/${testBorrowingId}/return`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should fail with non-existent borrowing', async () => {
      await request(app.getHttpServer())
        .patch('/borrowings/00000000-0000-0000-0000-000000000000/return')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Borrowing Availability Logic', () => {
    let newBorrowingId: string;

    it('should decrement available quantity when borrowing', async () => {
      // Get initial quantity
      const bookBefore = await request(app.getHttpServer())
        .get(`/books/${testBookId}`)
        .expect(200);

      const initialQty = bookBefore.body.availableQty;

      // Borrow the book
      const borrowResponse = await request(app.getHttpServer())
        .post('/borrowings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId: testBookId })
        .expect(201);

      newBorrowingId = borrowResponse.body.id;

      // Check quantity decreased
      const bookAfter = await request(app.getHttpServer())
        .get(`/books/${testBookId}`)
        .expect(200);

      expect(bookAfter.body.availableQty).toBe(initialQty - 1);
    });

    it('should increment available quantity when returning', async () => {
      // Get current quantity
      const bookBefore = await request(app.getHttpServer())
        .get(`/books/${testBookId}`)
        .expect(200);

      const beforeQty = bookBefore.body.availableQty;

      // Return the book
      await request(app.getHttpServer())
        .patch(`/borrowings/${newBorrowingId}/return`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Check quantity increased
      const bookAfter = await request(app.getHttpServer())
        .get(`/books/${testBookId}`)
        .expect(200);

      expect(bookAfter.body.availableQty).toBe(beforeQty + 1);
    });
  });
});
