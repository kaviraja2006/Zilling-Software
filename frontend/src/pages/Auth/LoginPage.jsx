import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import services from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Lock, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where they came from, or dashboard
    const from = location.state?.from?.pathname || '/';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 md:p-8 space-y-8 bg-white shadow-xl">
                <div className="text-center space-y-2">
                    <div className="mx-auto bg-primary-main text-white p-3 rounded-full w-fit">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                    <p className="text-slate-500">Sign in to your billing dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    setIsSubmitting(true);
                                    const { user, token } = await services.auth.googleLogin(credentialResponse.credential);

                                    // Manually setting context state or just relying on redirect
                                    localStorage.setItem('token', token);
                                    localStorage.setItem('user', JSON.stringify(user));

                                    // Force a reload or navigation to ensure context updates
                                    window.location.href = from;
                                } catch (error) {
                                    console.error('Google Login Error:', error);
                                    setError('Google Login failed. Please try again.');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            onError={(error) => {
                                console.error('Google Login Failed:', error);
                                setError('Google Login failed. Please check your internet connection or try again.');
                            }}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;
