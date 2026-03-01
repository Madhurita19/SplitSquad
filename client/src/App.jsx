import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './components/ConfirmModal';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import GroupDetail from './pages/Group/GroupDetail';
import JoinGroup from './pages/Group/JoinGroup';
import Landing from './pages/Landing/Landing';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Root Route Wrapper (Landing vs Dashboard)
const RootRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Landing />;

  return <Dashboard />;
};

function App() {
  return (
    <Router>
      <ConfirmProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#000000',
              border: '4px solid #000000',
              borderRadius: '0px',
              padding: '12px 16px',
              fontFamily: '"Archivo Black", "Space Grotesk", sans-serif',
              fontWeight: 900,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              boxShadow: '4px 4px 0px 0px #000000',
            },
            success: {
              style: {
                background: '#ADFF00',
                color: '#000000',
                border: '4px solid #000000',
              },
              iconTheme: {
                primary: '#000000',
                secondary: '#ADFF00',
              },
            },
            error: {
              style: {
                background: '#FF007A',
                color: '#FFFFFF',
                border: '4px solid #000000',
              },
              iconTheme: {
                primary: '#FFFFFF',
                secondary: '#FF007A',
              },
            },
          }}
        />
        <div className="page-wrapper">
          <main className="content-main">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/" element={<RootRoute />} />

              <Route path="/group/:id" element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              } />

              <Route path="/join/:inviteCode" element={
                <ProtectedRoute>
                  <JoinGroup />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </ConfirmProvider>
    </Router>
  );
}

export default App;
