import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">📚 Library System</Link>
      </div>

      <div className="navbar-links">
        <Link to="/books">Books</Link>
        <Link to="/authors">Authors</Link>

        {isAuthenticated && (
          <>
            <Link to="/my-borrowings">My Borrowings</Link>
            {isAdmin && (
              <>
                <Link to="/users">Users</Link>
                <Link to="/all-borrowings">All Borrowings</Link>
              </>
            )}
          </>
        )}
      </div>

      <div className="navbar-auth">
        {isAuthenticated ? (
          <div className="user-menu">
            <span className="user-name">
              {user?.name} {isAdmin && <span className="admin-badge">Admin</span>}
            </span>
            <button onClick={handleLogout} className="btn btn-logout">
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-login">
              Login
            </Link>
            <Link to="/register" className="btn btn-register">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
