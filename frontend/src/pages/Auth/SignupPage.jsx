import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/login', { replace: true });
    }, [navigate]);

    return null;
};

export default SignupPage;
