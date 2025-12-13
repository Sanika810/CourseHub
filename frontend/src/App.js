import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';
import MyCoursesPage from './pages/MyCoursesPage';
import AdminPage from './pages/AdminPage';
import NavBar from './components/NavBar';
import AddCourseModal from './components/AddCourseModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Main app content
const AppContent = () => {
  const { user, loading } = useAuth();
  const [showAddCourse, setShowAddCourse] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading CourseHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {user && <NavBar onAddCourse={() => setShowAddCourse(true)} />}
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/:id" 
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-courses" 
          element={
            <ProtectedRoute>
              <MyCoursesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {showAddCourse && <AddCourseModal onClose={() => setShowAddCourse(false)} />}
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <CourseProvider>
          <AppContent />
        </CourseProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;