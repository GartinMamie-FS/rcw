import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Auth.css';

interface AuthProps {
    onSignIn?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSignIn }) => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Clear error when inputs change
    useEffect(() => {
        if (error) setError('');
    }, [email, password]);

    const signIn = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                onSignIn?.();
            }
        } catch (err: any) {
            // Handle specific Firebase auth errors
            const errorMessage = err.code === 'auth/invalid-credential'
                ? 'Invalid email or password.'
                : 'An error occurred during sign in. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="auth-container" onSubmit={signIn}>
            <input
                className="auth-input"
                type="email"
                value={email}
                placeholder="Email..."
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
            />
            <input
                className="auth-input"
                type="password"
                value={password}
                placeholder="Password..."
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
            />
            <button
                className="auth-button"
                type="submit"
                disabled={isLoading}
            >
                {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {error && (
                <div className="error-message" role="alert">
                    <p>{error}</p>
                </div>
            )}
        </form>
    );
};