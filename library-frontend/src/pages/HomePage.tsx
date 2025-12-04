import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export function HomePage() {
  const { isAuthenticated, isAdmin, user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Welcome to the Library</h1>
        <p>Discover, borrow, and manage your favorite books</p>
        {!isAuthenticated && (
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/books" className="btn btn-secondary">
              Browse Books
            </Link>
          </div>
        )}
        {isAuthenticated && (
          <p className="welcome-user">
            Hello, <strong>{user?.name}</strong>! {isAdmin && '(Admin)'}
          </p>
        )}
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h3>Explore Books</h3>
          <p>Browse our collection of books from various authors and genres</p>
          <Link to="/books" className="feature-link">
            View Books →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">✍️</div>
          <h3>Discover Authors</h3>
          <p>Learn about the talented authors behind your favorite reads</p>
          <Link to="/authors" className="feature-link">
            View Authors →
          </Link>
        </div>

        {isAuthenticated && (
          <div className="feature-card">
            <div className="feature-icon">📖</div>
            <h3>My Borrowings</h3>
            <p>Track your borrowed books and borrowing history</p>
            <Link to="/my-borrowings" className="feature-link">
              View Borrowings →
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="feature-card admin">
            <div className="feature-icon">👥</div>
            <h3>Manage Users</h3>
            <p>View and manage all registered users</p>
            <Link to="/users" className="feature-link">
              View Users →
            </Link>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="info-section">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Create an Account</h4>
              <p>Sign up for free to access borrowing features</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>Browse & Borrow</h4>
              <p>Find books you love and borrow them instantly</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Return & Repeat</h4>
              <p>Return books when done and borrow more!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
