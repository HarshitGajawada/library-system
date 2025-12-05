export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const BorrowStatus = {
  BORROWED: 'BORROWED',
  RETURNED: 'RETURNED',
} as const;

export type BorrowStatus = (typeof BorrowStatus)[keyof typeof BorrowStatus];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
  books?: Book[];
  _count?: {
    books: number;
  };
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  quantity: number;
  availableQty: number;
  authorId: string;
  author?: Author;
  createdAt?: string;
  updatedAt?: string;
  borrowings?: Borrowing[];
}

export interface Borrowing {
  id: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: BorrowStatus;
  userId: string;
  bookId: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  book?: Book;
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface CreateBookData {
  title: string;
  isbn: string;
  authorId: string;
  quantity: number;
}

export interface UpdateBookData {
  title?: string;
  isbn?: string;
  authorId?: string;
  quantity?: number;
  availableQty?: number;
}

export interface CreateAuthorData {
  name: string;
  bio?: string;
}

export interface UpdateAuthorData {
  name?: string;
  bio?: string;
}

export interface BookFilters {
  authorId?: string;
  available?: boolean;
  search?: string;
}
