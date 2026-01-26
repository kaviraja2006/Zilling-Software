import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Card } from '../../components/ui/Card';
import { Lock, AlertCircle } from 'lucide-react';
import services from '../../services/api';

const LoginPage = () => {
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where they came from, or dashboard
    const from = location.state?.from?.pathname || '/';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 md:p-10 space-y-8 bg-white shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-2xl w-fit shadow-lg">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome to KWIQBILL</h1>
                    <p className="text-slate-600 text-lg">Sign in to access your billing dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-500 font-medium">Sign in with your Google account</p>
                        
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    try {
                                        setIsSubmitting(true);
                                        setError('');
                                        const { user, token } = await services.auth.googleLogin(credentialResponse.credential);

                                        // Store authentication data
                                        localStorage.setItem('token', token);
                                        localStorage.setItem('user', JSON.stringify(user));

                                        // Redirect to dashboard
                                        window.location.href = from;
                                    } catch (error) {
                                        console.error('Google Login Error:', error);
                                        setError('Google Sign In failed. Please try again.');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                onError={(error) => {
                                    console.error('Google Login Failed:', error);
                                    setError('Google Sign In failed. Please check your internet connection and try again.');
                                }}
                                size="large"
                                width="300"
                            />
                        </div>
                    </div>

                    {isSubmitting && (
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-slate-500 mt-2">Signing you in...</p>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <p className="text-xs text-center text-slate-500">
                        By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;
