import { useState, useEffect } from 'react';
import { usersApi } from '../api';
import { LoadingSpinner, ErrorMessage } from '../components';
import type { User } from '../types';
import './UsersPage.css';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
      setError('');
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div className="page">
      <h1 className="page-title">👥 Users</h1>
      <div className="page-content">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">All Users ({users.length})</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'ADMIN' ? 'badge-warning' : 'badge-success'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
