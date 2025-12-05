# Library Management System

A full-stack library management system built with NestJS, Prisma, PostgreSQL, and React.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Option 1: With Supabase (Cloud Database)](#option-1-with-supabase-cloud-database)
  - [Option 2: With Local PostgreSQL](#option-2-with-local-postgresql)
  - [Option 3: With Docker](#option-3-with-docker)
- [Running Migrations and Seeding Data](#running-migrations-and-seeding-data)
- [Testing Protected Routes](#testing-protected-routes)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [UI Flows](#ui-flows)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Quick Start Summary](#quick-start-summary)

---

## Features

- **Books Management**: CRUD operations with search and filter (by title, author, availability)
- **Authors Management**: CRUD operations for authors
- **User Management**: Admin can view all users
- **Borrowing System**: Users can borrow and return books (14-day loan period)
- **Role-based Access**: Admin and User roles with protected routes
- **JWT Authentication**: Secure login with token-based auth

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL (Supabase / Local / Docker) |
| Frontend | React 18, TypeScript, Vite |
| Auth | JWT (passport-jwt), bcrypt |
| Docs | Swagger/OpenAPI |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (Supabase, local, or Docker)

---

### Option 1: With Supabase (Cloud Database)

**Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project, set a database password
3. Go to **Settings** → **Database** → **Connection string** → **URI**
4. Copy the connection string

**Step 2: Setup Backend**
```bash
cd library-api
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="any-secret-string-here"
```

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start server
npm run start:dev
```

**Step 3: Setup Frontend**
```bash
cd library-frontend
npm install
npm run dev
```

---

### Option 2: With Local PostgreSQL

**Step 1: Install PostgreSQL**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt install postgresql
sudo systemctl start postgresql
```

**Step 2: Create Database**
```bash
psql postgres
CREATE DATABASE library_db;
\q
```

**Step 3: Setup Backend**
```bash
cd library-api
npm install
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://localhost:5432/library_db"
DIRECT_URL="postgresql://localhost:5432/library_db"
JWT_SECRET="any-secret-string-here"
```

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

**Step 4: Setup Frontend**
```bash
cd library-frontend
npm install
npm run dev
```

---

### Option 3: With Docker (Full Stack)

The project includes a complete Docker setup that runs PostgreSQL, Backend API, and Frontend together.

**Step 1: Setup Environment Variables**
```bash
# Copy the example environment file
cp .env.example .env
```

The `.env` file contains:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=library_db
JWT_SECRET=your_jwt_secret_here
```

**Step 2: Start All Services**
```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Backend API** on http://localhost:3000
- **Frontend** on http://localhost:5173

The backend automatically runs migrations and seeds demo data on first start.

**Step 3: Access the Application**
- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs

**Useful Docker Commands:**
```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset database (removes all data)
docker-compose down -v
docker-compose up --build
```

---

### Option 3b: Docker for Database Only

If you prefer to run backend/frontend locally but use Docker for PostgreSQL:

**Step 1: Start PostgreSQL**
```bash
docker run -d \
  --name library-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=library_db \
  -p 5432:5432 \
  postgres:16-alpine
```

**Step 2: Setup Backend**
```bash
cd library-api
npm install
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/library_db"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/library_db"
JWT_SECRET="any-secret-string-here"
```

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

**Step 3: Setup Frontend**
```bash
cd library-frontend
npm install
npm run dev
```

---

## Running Migrations and Seeding Data

### Generate Prisma Client
```bash
cd library-api
npx prisma generate
```

### Create/Run Migrations
```bash
# Create new migration (after schema changes)
npx prisma migrate dev --name <migration-name>

# Apply migrations to production
npx prisma migrate deploy
```

### Seed Demo Data
```bash
npx prisma db seed
```

This creates:
- **Admin user**: admin@library.com / admin123
- **Regular users**: john@example.com, jane@example.com (password: user123)
- **5 authors** with biographies
- **10 books** across different genres
- **Sample borrowings**

### View Database (GUI)
```bash
npx prisma studio
```
Opens at http://localhost:5555

### Reset Database
```bash
npx prisma migrate reset
```
This drops all data, re-runs migrations, and re-seeds.

---

## Testing Protected Routes

### Step 1: Get a JWT Token

**Using cURL:**
```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@library.com", "password": "admin123"}'

# Response:
# {"access_token": "eyJhbGciOiJIUzI1NiIs..."}
```

**Using Swagger UI:**
1. Open http://localhost:3000/api/docs
2. Go to **Auth** → **POST /api/auth/login**
3. Click "Try it out"
4. Enter: `{"email": "admin@library.com", "password": "admin123"}`
5. Copy the `access_token` from response

### Step 2: Use Token for Protected Routes

**Using cURL:**
```bash
# Get all users (admin only)
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Borrow a book
curl -X POST http://localhost:3000/api/borrowings/borrow \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"bookId": "BOOK_UUID_HERE"}'

# Get my borrowings
curl http://localhost:3000/api/borrowings/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Using Swagger UI:**
1. Click "Authorize" button (top right)
2. Enter: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize"
4. Now all protected endpoints will include the token

### Step 3: Test Different Roles

| Account | Email | Password | Can Access |
|---------|-------|----------|------------|
| Admin | admin@library.com | admin123 | Everything |
| User | john@example.com | user123 | Books, Authors, Own Borrowings |

**Admin-only endpoints:**
- GET `/api/users` - List all users
- GET `/api/borrowings` - All borrowings
- POST/PATCH/DELETE `/api/books` - Manage books
- POST/PATCH/DELETE `/api/authors` - Manage authors

---

## API Routes

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/me` | Get current user | Required |

### Books
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/books` | List books (with filters) | Public |
| GET | `/api/books/:id` | Get book details | Public |
| POST | `/api/books` | Create book | Admin |
| PATCH | `/api/books/:id` | Update book | Admin |
| DELETE | `/api/books/:id` | Delete book | Admin |

**Filters:** `?search=gatsby&authorId=uuid&available=true`

### Authors
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/authors` | List all authors | Public |
| GET | `/api/authors/:id` | Get author + books | Public |
| POST | `/api/authors` | Create author | Admin |
| PATCH | `/api/authors/:id` | Update author | Admin |
| DELETE | `/api/authors/:id` | Delete author | Admin |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user details | Required |

### Borrowings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/borrowings/borrow` | Borrow a book | Required |
| POST | `/api/borrowings/return/:id` | Return a book | Required |
| GET | `/api/borrowings/my` | My borrowings | Required |
| GET | `/api/borrowings` | All borrowings | Admin |

---

## Database Schema

```prisma
enum Role {
  USER
  ADMIN
}

enum BorrowStatus {
  BORROWED
  RETURNED
  OVERDUE
}

model User {
  id         String      @id @default(uuid())
  email      String      @unique
  password   String      // bcrypt hashed
  name       String
  role       Role        @default(USER)
  borrowings Borrowing[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model Author {
  id        String   @id @default(uuid())
  name      String
  biography String?
  books     Book[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Book {
  id           String      @id @default(uuid())
  title        String
  isbn         String      @unique
  authorId     String
  author       Author      @relation(fields: [authorId], references: [id])
  quantity     Int         @default(1)  // Total copies
  availableQty Int         @default(1)  // Available copies
  borrowings   Borrowing[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Borrowing {
  id         String       @id @default(uuid())
  userId     String
  user       User         @relation(fields: [userId], references: [id])
  bookId     String
  book       Book         @relation(fields: [bookId], references: [id])
  borrowDate DateTime     @default(now())
  dueDate    DateTime     // borrowDate + 14 days
  returnDate DateTime?    // null until returned
  status     BorrowStatus @default(BORROWED)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}
```

---

## UI Flows

### Public Flow
```
Home Page → Books (browse/search/filter) → Authors (view all)
```

### User Flow (after login)
```
Login → Home → Books → Click "Borrow" → My Borrowings → Click "Return"
```

### Admin Flow
```
Login → Home → Books (Add/Edit/Delete) → Authors (Add/Edit/Delete) 
            → Users (view all) → All Borrowings (view all)
```

### Frontend Routes
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home page |
| `/books` | Public | Browse books |
| `/authors` | Public | Browse authors |
| `/login` | Public | Login page |
| `/register` | Public | Register page |
| `/my-borrowings` | User | My borrowed books |
| `/users` | Admin | All users |
| `/all-borrowings` | Admin | All borrowings |

---

## Design Decisions & Assumptions

### Assumptions Made

1. **Borrowing Duration**: Fixed at 14 days (hardcoded). A real system would make this configurable.

2. **ISBN Format**: Stored as simple string without validation. Real systems would validate ISBN-10/13 format.

3. **Single Copy Borrowing**: Users can borrow multiple different books but only one copy of each book at a time.

4. **No Reservations**: If a book is unavailable, users must wait. No reservation queue implemented.

5. **No Fines**: Overdue books don't incur fines. Status changes to OVERDUE but no monetary penalty.

6. **Email Uniqueness**: Email is the unique identifier for users. No username field.

### Design Choices

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **availableQty on Book** | Store directly | Faster reads vs calculating from borrowings each time |
| **JWT Expiry** | 7 days | Simpler for demo; production would use 15-60 min + refresh tokens |
| **Password Hashing** | bcrypt (10 rounds) | Industry standard, good security/performance balance |
| **State Management** | React Context | Simple app, only auth state is global; avoids Redux complexity |
| **Role System** | Simple enum | Only 2 roles needed; avoids over-engineering permissions |
| **API Prefix** | `/api` | Clear separation, easy to proxy in production |
| **Validation** | class-validator + ValidationPipe | NestJS native, automatic DTO validation |
| **Database** | PostgreSQL | Relational data with clear relationships; Prisma ORM support |

### Security Considerations

- Passwords hashed with bcrypt before storage
- JWT tokens required for protected routes
- Role-based guards on admin endpoints
- CORS configured for frontend origin
- Input validation on all endpoints

### What I Would Add in Production

1. Refresh token rotation for better security
2. Rate limiting on auth endpoints
3. Email verification on registration
4. Password reset functionality
5. Audit logging for admin actions
6. Pagination on list endpoints
7. Full-text search with PostgreSQL
8. Automated overdue status updates (cron job)

---

## Quick Start Summary

```bash
# Terminal 1 - Backend
cd library-api
npm install
cp .env.example .env  # Edit with your DB connection
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev     # http://localhost:3000

# Terminal 2 - Frontend
cd library-frontend
npm install
npm run dev           # http://localhost:5173
```

**Demo Login:**
- Admin: admin@library.com / admin123
- User: john@example.com / user123

**Swagger Docs:** http://localhost:3000/api/docs
