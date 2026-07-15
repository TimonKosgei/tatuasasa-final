import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../../config/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccessMessage("Password reset link sent! Please check your email inbox to proceed.");
    } catch (err) {
      console.error("Reset request error:", err);
      setError(err.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
      <form 
        className="w-full max-w-xl rounded-[32px] border border-[var(--color-line)] bg-white/95 p-10 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.2)]" 
        onSubmit={handleResetRequest}
      >
        <h1 className="text-3xl font-bold tracking-tight">Tatua Sasa</h1>
        <h2 className="mt-3 text-sm font-semibold text-[var(--color-muted)]">Reset your Password</h2>
        
        {error && (
          <div className="mt-6 text-center text-sm font-medium text-red-500 bg-red-50 border border-red-200 p-3 rounded-xl">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mt-6 text-center text-sm font-medium text-green-600 bg-green-50 border border-green-200 p-3 rounded-xl">
            {successMessage}
          </div>
        )}
        
        <div className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-3 text-sm font-semibold" htmlFor="email">
            Email Address:
            <input 
              className="h-14 w-full rounded-[14px] border border-[var(--color-line)] bg-[var(--surface)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-ink)] focus:ring-4 focus:ring-[rgba(15,23,42,0.08)] disabled:opacity-50"
              type="email"
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={loading}
              placeholder="name@company.com"
            />
          </label>
        </div>
        
        <button 
          type="submit" 
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--color-ink)] px-4 py-4 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-95 disabled:opacity-50"
          disabled={loading}
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Sending Link...' : 'Send Reset Link'}
        </button>

        <div className="mt-6 text-sm text-[var(--color-muted)] text-center">
          <p>
            Remembered your credentials? <Link to="/auth/login" className="font-semibold text-[var(--color-ink)] hover:underline">Back to Login</Link>
          </p>
        </div>
      </form>
    </div>
  );
}