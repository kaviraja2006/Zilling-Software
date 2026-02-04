import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const { settings } = useSettings();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Onboarding Check
    const isOnboardingComplete = !!settings?.onboardingCompletedAt;
    const isOnboardingPage = location.pathname === '/complete-profile';

    if (!isOnboardingComplete && !isOnboardingPage) {
        return <Navigate to="/complete-profile" replace />;
    }

    if (isOnboardingComplete && isOnboardingPage) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
