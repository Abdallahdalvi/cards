import * as React from 'react';
import { useState } from 'react';
import { Grid, Mail, Lock, ArrowRight, Loader2, Chrome } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthWrapperProps {
  children: (userId: string) => React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="auth-loading">
        <Loader2 size={32} className="spin-icon" />
        <p>Loading DalviCard...</p>
      </div>
    );
  }

  // ─── Authenticated — render app ─────────────────────────────────────────────
  if (user) {
    return <>{children(user.id)}</>;
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { error } = authMode === 'signup'
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) throw error;

      if (authMode === 'signup') {
        setError('Check your email to confirm your account before signing in.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message || 'Google sign-in failed');
  };

  // ─── Auth form ──────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Grid size={28} color="#2563EB" />
          <h1>DalviCard CRM</h1>
          <p>AI-Powered Business Card Scanner</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
            onClick={() => { setAuthMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <Mail size={16} className="auth-field-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <Lock size={16} className="auth-field-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? (
              <Loader2 size={18} className="spin-icon" />
            ) : (
              <>
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-google-btn" onClick={handleGoogleSignIn}>
          <Chrome size={18} />
          Continue with Google
        </button>

        <p className="auth-footer-text">
          {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span
            className="auth-link"
            onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            {authMode === 'login' ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthWrapper;
