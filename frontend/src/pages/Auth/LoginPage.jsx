import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import services from '../../services/api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where they came from, or dashboard
    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            console.error("Login Submission Error:", err);
            const msg = err.response?.data?.message || err.message || 'Login failed';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

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

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    className="pl-10"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <Input
                                    className="pl-10"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button className="w-full h-10" variant="primary" type="submit" isLoading={isSubmitting}>
                        Sign In
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex justify-center w-full">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                try {
                                    setIsSubmitting(true);
                                    const { user, token } = await services.auth.googleLogin(credentialResponse.credential);

                                    // Manually setting context state or just relying on redirect
                                    // ideally useAuth should expose a method to handle this, but for now we set storage manually
                                    // reusing the logic from AuthContext would be better but this is quick.
                                    localStorage.setItem('token', token);
                                    localStorage.setItem('user', JSON.stringify(user));

                                    // Force a reload or navigation to ensure context updates
                                    // Since verifyUser in AuthContext runs on mount, a reload is safest if direct state update isn't available
                                    // navigate(from, { replace: true });
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

                    <div className="text-center mt-4">
                        <p>Don't have an account? <Link to="/signup" className="text-primary-main hover:underline">Sign Up</Link></p>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
