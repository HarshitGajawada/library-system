import { useState, useEffect } from 'react';
import { borrowingsApi } from '../api';
import { LoadingSpinner, ErrorMessage } from '../components';
import type { Borrowing } from '../types';
import './BorrowingsPage.css';

type FilterType = 'all' | 'active' | 'overdue' | 'returned';

export function AllBorrowingsPage() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchBorrowings = async () => {
    try {
      setIsLoading(true);
      const data = await borrowingsApi.getAll();
      setBorrowings(data);
      setError('');
    } catch {
      setError('Failed to load borrowings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBorrowings(); }, []);

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

  const activeBorrowings = borrowings.filter(b => b.status === 'BORROWED');
  const overdueBorrowings = activeBorrowings.filter(b => new Date(b.dueDate) < new Date());
  const returnedBorrowings = borrowings.filter(b => b.status === 'RETURNED');

  const filteredBorrowings = borrowings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'active') return b.status === 'BORROWED' && !isOverdue(b.dueDate, b.status);
    if (filter === 'overdue') return isOverdue(b.dueDate, b.status);
    if (filter === 'returned') return b.status === 'RETURNED';
    return true;
  });

  if (error) return <ErrorMessage message={error} onRetry={fetchBorrowings} />;

  return (
    <div className="page">
      <h1 className="page-title">📊 All Borrowings</h1>
      <div className="page-content">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Stats */}
            <div className="borrowing-stats">
              <div 
                className={`stat-item ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                <span className="stat-value">{borrowings.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div 
                className={`stat-item ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                <span className="stat-value">{activeBorrowings.length - overdueBorrowings.length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div 
                className={`stat-item ${filter === 'overdue' ? 'active' : ''}`}
                onClick={() => setFilter('overdue')}
              >
                <span className="stat-value warning">{overdueBorrowings.length}</span>
                <span className="stat-label">Overdue</span>
              </div>
              <div 
                className={`stat-item ${filter === 'returned' ? 'active' : ''}`}
                onClick={() => setFilter('returned')}
              >
                <span className="stat-value">{returnedBorrowings.length}</span>
                <span className="stat-label">Returned</span>
              </div>
            </div>

            {/* Table */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  {filter === 'all' && 'All Borrowings'}
                  {filter === 'active' && 'Active Borrowings'}
                  {filter === 'overdue' && 'Overdue Borrowings'}
                  {filter === 'returned' && 'Returned Borrowings'}
                  {' '}({filteredBorrowings.length})
                </h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Book</th>
                    <th>Borrowed</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrowings.map((borrowing) => (
                    <tr key={borrowing.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {borrowing.user?.name?.charAt(0) || '?'}
                          </div>
                          <div className="user-details">
                            <span className="user-name">{borrowing.user?.name}</span>
                            <span className="user-email">{borrowing.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="book-info">
                          <span className="book-title">{borrowing.book?.title}</span>
                          <span className="book-author">{borrowing.book?.author?.name}</span>
                        </div>
                      </td>
                      <td>{formatDate(borrowing.borrowDate)}</td>
                      <td>{formatDate(borrowing.dueDate)}</td>
                      <td>
                        {borrowing.status === 'RETURNED' ? (
                          <span className="badge badge-success">Returned</span>
                        ) : isOverdue(borrowing.dueDate, borrowing.status) ? (
                          <span className="badge badge-error">Overdue</span>
                        ) : (
                          <span className="badge badge-warning">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
