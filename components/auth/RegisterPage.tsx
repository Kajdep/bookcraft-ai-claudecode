import React, { useState } from 'react';
import { Button, Card, Input } from '../UI';
import { BookOpenIcon, CheckCircleIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const register = useBookCraftStore(state => state.register);

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const passwordLength = password.length >= 8;
    const formValid = name && email && passwordsMatch && passwordLength;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formValid) {
            return;
        }

        setIsLoading(true);
        await register(email, password, name);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 shadow-2xl">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <BookOpenIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 text-transparent bg-clip-text mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Join WrittenUpAi and start writing</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                        </label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            autoComplete="name"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                required
                                autoComplete="new-password"
                                disabled={isLoading}
                                className="pr-20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-primary hover:underline"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {/* Password strength indicator */}
                        {password && (
                            <div className="mt-2 flex items-center space-x-2 text-xs">
                                <CheckCircleIcon className={`w-4 h-4 ${passwordLength ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className={passwordLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                                    At least 8 characters
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                autoComplete="new-password"
                                disabled={isLoading}
                                className="pr-20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-primary hover:underline"
                            >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {/* Password match indicator */}
                        {confirmPassword && (
                            <div className="mt-2 flex items-center space-x-2 text-xs">
                                <CheckCircleIcon className={`w-4 h-4 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`} />
                                <span className={passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={isLoading || !formValid}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Creating account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                            Already have an account?
                        </span>
                    </div>
                </div>

                {/* Login Link */}
                <Button
                    variant="secondary"
                    className="w-full"
                    onClick={onSwitchToLogin}
                    disabled={isLoading}
                >
                    Sign In Instead
                </Button>

                {/* Privacy Note */}
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                        Privacy First
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                        All your data is stored locally in your browser. We don't send your information to any servers.
                    </p>
                </div>
            </Card>
        </div>
    );
};
