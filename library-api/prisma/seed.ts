import { PrismaClient, Role, BorrowStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.borrowing.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create users
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedUserPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@library.com',
      password: hashedAdminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: hashedUserPassword,
      name: 'John Doe',
      role: Role.USER,
    },
  });

  const jane = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedUserPassword,
      name: 'Jane Smith',
      role: Role.USER,
    },
  });

  console.log('👥 Created users');

  // Create authors
  const orwell = await prisma.author.create({
    data: {
      name: 'George Orwell',
      bio: 'English novelist, essayist, and critic famous for his novels Animal Farm and Nineteen Eighty-Four.',
    },
  });

  const rowling = await prisma.author.create({
    data: {
      name: 'J.K. Rowling',
      bio: 'British author best known for writing the Harry Potter fantasy series.',
    },
  });

  const christie = await prisma.author.create({
    data: {
      name: 'Agatha Christie',
      bio: 'English writer known for her 66 detective novels and 14 short story collections.',
    },
  });

  const king = await prisma.author.create({
    data: {
      name: 'Stephen King',
      bio: 'American author of horror, supernatural fiction, suspense, crime, and fantasy novels.',
    },
  });

  const austen = await prisma.author.create({
    data: {
      name: 'Jane Austen',
      bio: 'English novelist known primarily for her six major novels interpreting 18th-century English landed gentry.',
    },
  });

  console.log('✍️  Created authors');

  // Create books
  const book1984 = await prisma.book.create({
    data: {
      title: '1984',
      isbn: '9780451524935',
      quantity: 5,
      availableQty: 5,
      authorId: orwell.id,
    },
  });

  const animalFarm = await prisma.book.create({
    data: {
      title: 'Animal Farm',
      isbn: '9780451526342',
      quantity: 4,
      availableQty: 4,
      authorId: orwell.id,
    },
  });

  const harryPotter1 = await prisma.book.create({
    data: {
      title: "Harry Potter and the Philosopher's Stone",
      isbn: '9780747532699',
      quantity: 8,
      availableQty: 8,
      authorId: rowling.id,
    },
  });

  const harryPotter2 = await prisma.book.create({
    data: {
      title: 'Harry Potter and the Chamber of Secrets',
      isbn: '9780747538486',
      quantity: 6,
      availableQty: 6,
      authorId: rowling.id,
    },
  });

  const harryPotter3 = await prisma.book.create({
    data: {
      title: 'Harry Potter and the Prisoner of Azkaban',
      isbn: '9780747542155',
      quantity: 7,
      availableQty: 7,
      authorId: rowling.id,
    },
  });

  const murderOrientExpress = await prisma.book.create({
    data: {
      title: 'Murder on the Orient Express',
      isbn: '9780062693662',
      quantity: 4,
      availableQty: 4,
      authorId: christie.id,
    },
  });

  const andThenThereWereNone = await prisma.book.create({
    data: {
      title: 'And Then There Were None',
      isbn: '9780062073488',
      quantity: 3,
      availableQty: 3,
      authorId: christie.id,
    },
  });

  const theShining = await prisma.book.create({
    data: {
      title: 'The Shining',
      isbn: '9780307743657',
      quantity: 5,
      availableQty: 5,
      authorId: king.id,
    },
  });

  const prideAndPrejudice = await prisma.book.create({
    data: {
      title: 'Pride and Prejudice',
      isbn: '9780141439518',
      quantity: 6,
      availableQty: 6,
      authorId: austen.id,
    },
  });

  const senseAndSensibility = await prisma.book.create({
    data: {
      title: 'Sense and Sensibility',
      isbn: '9780141439662',
      quantity: 4,
      availableQty: 4,
      authorId: austen.id,
    },
  });

  console.log('📚 Created books');

  // Create sample borrowings
  // John borrowed 1984 (active)
  const dueDate1 = new Date();
  dueDate1.setDate(dueDate1.getDate() + 14);

  await prisma.borrowing.create({
    data: {
      userId: john.id,
      bookId: book1984.id,
      dueDate: dueDate1,
      status: BorrowStatus.BORROWED,
    },
  });

  // Update available quantity
  await prisma.book.update({
    where: { id: book1984.id },
    data: { availableQty: 4 },
  });

  // Jane borrowed Harry Potter 1 (active)
  const dueDate2 = new Date();
  dueDate2.setDate(dueDate2.getDate() + 10);

  await prisma.borrowing.create({
    data: {
      userId: jane.id,
      bookId: harryPotter1.id,
      dueDate: dueDate2,
      status: BorrowStatus.BORROWED,
    },
  });

  await prisma.book.update({
    where: { id: harryPotter1.id },
    data: { availableQty: 7 },
  });

  // John had borrowed and returned Pride and Prejudice
  const pastBorrowDate = new Date();
  pastBorrowDate.setDate(pastBorrowDate.getDate() - 20);
  const pastDueDate = new Date();
  pastDueDate.setDate(pastDueDate.getDate() - 6);
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() - 8);

  await prisma.borrowing.create({
    data: {
      userId: john.id,
      bookId: prideAndPrejudice.id,
      borrowDate: pastBorrowDate,
      dueDate: pastDueDate,
      returnDate: returnDate,
      status: BorrowStatus.RETURNED,
    },
  });

  console.log('📖 Created borrowings');

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin: admin@library.com / admin123');
  console.log('   User:  john@example.com / user123');
  console.log('   User:  jane@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
