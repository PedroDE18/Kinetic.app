import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const { signIn, signUp, resetPassword, formatAuthError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        await resetPassword(email);
        setResetSuccessMessage('Password reset link sent! Check your inbox.');
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-sunken)] text-[var(--color-text)] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[var(--color-accent)] rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Eunoia Header / Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-serif font-black text-2xl shadow-xs border border-[var(--color-accent)]/20 mb-1">
            Ε
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] flex items-center justify-center gap-2">
            Eunoia
            <span className="text-xs font-semibold px-2 py-0.5 bg-[var(--color-surface-raised)] text-[var(--color-accent)] rounded-full border border-[var(--color-border)]">
              Cloud
            </span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
            {mode === 'signin' && 'Sign in to access your flourishing practices, reflections, and health metrics synced across devices.'}
            {mode === 'signup' && 'Create your account to synchronize your habits, contemplative journals, and physical training.'}
            {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          {/* Tab Selector: Sign In vs Create Account */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 bg-[var(--color-surface-sunken)] rounded-2xl border border-[var(--color-border)] text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setResetSuccessMessage(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setResetSuccessMessage(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm font-semibold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Reset Success Message */}
          {resetSuccessMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Display Name (only in Sign Up mode) */}
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block">Name (Optional)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--color-text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex"
                    autoComplete="name"
                    className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--color-text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
            </div>

            {/* Password Field (only for signin / signup) */}
            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage(null);
                        setResetSuccessMessage(null);
                      }}
                      className="text-[11px] text-[var(--color-accent)] hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--color-text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[44px] mt-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : mode === 'signup' ? (
                'Create Free Account'
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to sign in if in forgot mode */}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setResetSuccessMessage(null);
              }}
              className="w-full text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-2"
            >
              ← Back to Sign In
            </button>
          )}

          {/* Privacy & Free Guarantee */}
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-center gap-2 text-[11px] text-[var(--color-text-subtle)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted per-user data on Firebase • Free tier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
