import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar, ProtectedRoute, AdminRoute } from './components';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  BooksPage,
  AuthorsPage,
  UsersPage,
  MyBorrowingsPage,
  AllBorrowingsPage,
} from './pages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/authors" element={<AuthorsPage />} />

              {/* Protected routes (authenticated users) */}
              <Route
                path="/my-borrowings"
                element={
                  <ProtectedRoute>
                    <MyBorrowingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <UsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/all-borrowings"
                element={
                  <AdminRoute>
                    <AllBorrowingsPage />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
