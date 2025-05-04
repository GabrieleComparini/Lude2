import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersList from './pages/users/UsersList';
import UserDetails from './pages/users/UserDetails';
import TracksList from './pages/tracks/TracksList';
import TrackDetails from './pages/tracks/TrackDetails';
import PhotosList from './pages/photos/PhotosList';
import PhotoDetails from './pages/photos/PhotoDetails';
import ApiTester from './pages/ApiTester';
import NotFound from './pages/NotFound';

// Route privata che richiede autenticazione
const PrivateRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  console.log('PrivateRoute check:', { 
    currentUser: currentUser ? 'presente' : 'assente', 
    userData: userData ? 'presente' : 'assente',
    userRole: userData?.role,
    isAdmin: userData?.role === 'admin',
    loading
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Se non c'è un utente autenticato o non è admin, reindirizza al login
  if (!currentUser || !userData || userData.role !== 'admin') {
    console.log('Accesso negato, reindirizzamento al login');
    return <Navigate to="/login" replace />;
  }

  console.log('Accesso consentito alla dashboard');
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Rotte pubbliche */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Rotte private */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        
        {/* Rotte utenti */}
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/:id" element={<UserDetails />} />
        
        {/* Rotte tracce */}
        <Route path="/tracks" element={<TracksList />} />
        <Route path="/tracks/:id" element={<TrackDetails />} />
        
        {/* Rotte foto */}
        <Route path="/photos" element={<PhotosList />} />
        <Route path="/photos/:id" element={<PhotoDetails />} />
        
        {/* Strumenti di sviluppo */}
        <Route path="/api-tester" element={<ApiTester />} />
      </Route>

      {/* Pagina 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 