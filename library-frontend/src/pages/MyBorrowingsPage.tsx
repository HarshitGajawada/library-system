import { useState, useEffect } from 'react';
import { borrowingsApi } from '../api';
import { LoadingSpinner, ErrorMessage } from '../components';
import type { Borrowing } from '../types';
import './BorrowingsPage.css';

export function MyBorrowingsPage() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [returningId, setReturningId] = useState<string | null>(null);

  const fetchBorrowings = async () => {
    try {
      setIsLoading(true);
      const data = await borrowingsApi.getMyBorrowings();
      setBorrowings(data);
      setError('');
    } catch {
      setError('Failed to load borrowings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBorrowings(); }, []);

  const handleReturn = async (id: string) => {
    try {
      setReturningId(id);
      await borrowingsApi.return(id);
      await fetchBorrowings();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'BORROWED' && new Date(dueDate) < new Date();
  };

  if (error) return <ErrorMessage message={error} onRetry={fetchBorrowings} />;

  const activeBorrowings = borrowings.filter((b) => b.status === 'BORROWED');
  const returnedBorrowings = borrowings.filter((b) => b.status === 'RETURNED');

  return (
    <div className="page">
      <h1 className="page-title">📋 My Borrowings</h1>
      <div className="page-content">
        {isLoading ? (
          <LoadingSpinner />
        ) : borrowings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h3>No borrowings yet</h3>
            <p>Browse our book collection and borrow your first book!</p>
          </div>
        ) : (
          <div className="borrowings-sections">
            {activeBorrowings.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Currently Borrowed ({activeBorrowings.length})</h3>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Borrowed</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBorrowings.map((borrowing) => (
                      <tr key={borrowing.id}>
                        <td>
                          <div className="book-info">
                            <span className="book-title">{borrowing.book?.title}</span>
                            <span className="book-author">{borrowing.book?.author?.name}</span>
                          </div>
                        </td>
                        <td>{formatDate(borrowing.borrowDate)}</td>
                        <td>{formatDate(borrowing.dueDate)}</td>
                        <td>
                          <span className={`badge ${isOverdue(borrowing.dueDate, borrowing.status) ? 'badge-error' : 'badge-warning'}`}>
                            {isOverdue(borrowing.dueDate, borrowing.status) ? 'Overdue' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReturn(borrowing.id)}
                            disabled={returningId === borrowing.id}
                          >
                            {returningId === borrowing.id ? 'Returning...' : 'Return'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {returnedBorrowings.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">History ({returnedBorrowings.length})</h3>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Borrowed</th>
                      <th>Returned</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnedBorrowings.map((borrowing) => (
                      <tr key={borrowing.id}>
                        <td>
                          <div className="book-info">
                            <span className="book-title">{borrowing.book?.title}</span>
                            <span className="book-author">{borrowing.book?.author?.name}</span>
                          </div>
                        </td>
                        <td>{formatDate(borrowing.borrowDate)}</td>
                        <td>{borrowing.returnDate ? formatDate(borrowing.returnDate) : '-'}</td>
                        <td>
                          <span className="badge badge-success">Returned</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
