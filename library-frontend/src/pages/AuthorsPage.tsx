import { useState, useEffect } from 'react';
import { authorsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../components';
import type { Author, CreateAuthorData } from '../types';
import './AuthorsPage.css';

export function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [formData, setFormData] = useState<CreateAuthorData>({ name: '', bio: '' });

  const fetchAuthors = async () => {
    try {
      setIsLoading(true);
      const data = await authorsApi.getAll();
      setAuthors(data);
      setError('');
    } catch {
      setError('Failed to load authors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAuthors(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this author?')) return;
    try {
      await authorsApi.delete(id);
      await fetchAuthors();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete author');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAuthor) {
        await authorsApi.update(editingAuthor.id, formData);
      } else {
        await authorsApi.create(formData);
      }
      setShowModal(false);
      setEditingAuthor(null);
      setFormData({ name: '', bio: '' });
      await fetchAuthors();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to save author');
    }
  };

  const openEditModal = (author: Author) => {
    setEditingAuthor(author);
    setFormData({ name: author.name, bio: author.bio || '' });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingAuthor(null);
    setFormData({ name: '', bio: '' });
    setShowModal(true);
  };

  if (error) return <ErrorMessage message={error} onRetry={fetchAuthors} />;

  return (
    <div className="page">
      <h1 className="page-title">✍️ Authors</h1>
      <div className="page-content">
        <div className="page-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add Author
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="authors-grid">
            {authors.map((author) => (
              <div key={author.id} className="author-card">
                <div className="author-avatar">
                  {author.name.charAt(0)}
                </div>
                <div className="author-info">
                  <h3 className="author-name">{author.name}</h3>
                  <p className="author-bio">{author.bio || 'No biography available'}</p>
                  <div className="author-stats">
                    <span className="book-count">{author._count?.books || 0} books</span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="author-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(author)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(author.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editingAuthor ? 'Edit Author' : 'Add Author'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Biography</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingAuthor ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
