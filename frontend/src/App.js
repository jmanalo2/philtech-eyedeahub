import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import IdeasList from './pages/IdeasList';
import IdeaDetail from './pages/IdeaDetail';
import CreateIdea from './pages/CreateIdea';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import '@/App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ideas" element={<IdeasList />} />
            <Route path="ideas/:id" element={<IdeaDetail />} />
            <Route path="ideas/new" element={<CreateIdea />} />
            <Route path="ideas/edit/:id" element={<CreateIdea />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;