import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to login page since we only use Google Sign In
        navigate('/login', { replace: true });
    }, [navigate]);

    return null;
};

export default SignupPage;
