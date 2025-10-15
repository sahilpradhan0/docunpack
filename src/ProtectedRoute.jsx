import React from 'react'
import { useAuth } from './context/useAuth'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/" replace />
    return children;
}

export default ProtectedRoute
