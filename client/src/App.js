import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import Chatbot from './components/Chatbot';
import axios from 'axios';

axios.defaults.baseURL = 'https://moneymind-hackathon.onrender.com';



const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  return user ? children : <Navigate to="/auth" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/*" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      </Routes>
      {user && <Chatbot />}
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
