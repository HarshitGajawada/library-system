import { useState, useEffect, useMemo } from 'react';
import { booksApi, authorsApi, borrowingsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../components';
import type { Book, Author, BookFilters } from '../types';
import './BooksPage.css';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [borrowingBookId, setBorrowingBookId] = useState<string | null>(null);
  const { isAuthenticated, isAdmin } = useAuth();

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  // Modal states for admin
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    authorId: '',
    quantity: 1,
  });

  // Build filters object
  const filters: BookFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    authorId: authorFilter || undefined,
    available: availableFilter === '' ? undefined : availableFilter === 'true',
  }), [debouncedSearch, authorFilter, availableFilter]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const booksData = await booksApi.getAll(filters);
      setBooks(booksData);
      setError('');
    } catch {
      setError('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const authorsData = await authorsApi.getAll();
      setAuthors(authorsData);
    } catch {
      console.error('Failed to load authors');
    }
  };

  // Fetch authors once on mount
  useEffect(() => {
    fetchAuthors();
  }, []);

  // Fetch books when filters change
  useEffect(() => {
    fetchBooks();
  }, [filters]);

  const handleBorrow = async (bookId: string) => {
    try {
      setBorrowingBookId(bookId);
      await borrowingsApi.borrow(bookId);
      await fetchBooks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to borrow book');
    } finally {
      setBorrowingBookId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await booksApi.delete(id);
      await fetchBooks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete book');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await booksApi.update(editingBook.id, formData);
      } else {
        await booksApi.create(formData);
      }
      setShowModal(false);
      setEditingBook(null);
      setFormData({ title: '', isbn: '', authorId: '', quantity: 1 });
      await fetchBooks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to save book');
    }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      isbn: book.isbn,
      authorId: book.authorId,
      quantity: book.quantity,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({ title: '', isbn: '', authorId: authors[0]?.id || '', quantity: 1 });
    setShowModal(true);
  };

  if (isLoading && books.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBooks} />;

  return (
    <div className="books-page">
      <div className="page-header">
        <h1>📚 Books</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Book
          </button>
        )}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input"
        />
        <select
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Authors</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        <select
          value={availableFilter}
          onChange={(e) => setAvailableFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Availability</option>
          <option value="true">Available</option>
          <option value="false">Not Available</option>
        </select>
      </div>

      <div className="books-grid">
        {books.length === 0 ? (
          <p className="no-results">No books found</p>
        ) : (
          books.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-cover">📖</div>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p className="author">by {book.author?.name}</p>
                <p className="isbn">ISBN: {book.isbn}</p>
                <div className="availability">
                  <span className={book.availableQty > 0 ? 'available' : 'unavailable'}>
                    {book.availableQty} / {book.quantity} available
                  </span>
                </div>
                <div className="book-actions">
                  {isAuthenticated && book.availableQty > 0 && (
                    <button
                      className="btn btn-borrow"
                      onClick={() => handleBorrow(book.id)}
                      disabled={borrowingBookId === book.id}
                    >
                      {borrowingBookId === book.id ? 'Borrowing...' : 'Borrow'}
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button className="btn btn-edit" onClick={() => openEditModal(book)}>
                        Edit
                      </button>
                      <button className="btn btn-delete" onClick={() => handleDelete(book.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBook ? 'Edit Book' : 'Add Book'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <select
                  value={formData.authorId}
                  onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                  required
                >
                  <option value="">Select Author</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBook ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
