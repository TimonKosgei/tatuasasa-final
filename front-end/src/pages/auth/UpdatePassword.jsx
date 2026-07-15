import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from '../../config/auth';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationTriggered, setValidationTriggered] = useState(false);

  const isPasswordMismatch = validationTriggered && password !== confirmPassword;
  const isPasswordTooShort = validationTriggered && password.length > 0 && password.length < 6;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setValidationTriggered(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccessMessage("Password successfully updated! Redirecting to login...");
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err) {
      console.error("Password update error:", err);
      setError(err.message || "Failed to update password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
      <form 
        className="w-full max-w-xl rounded-[32px] border border-[var(--color-line)] bg-white/95 p-10 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.2)]" 
        onSubmit={handleUpdate}
      >
        <h1 className="text-3xl font-bold tracking-tight">Tatua Sasa</h1>
        <h2 className="mt-3 text-sm font-semibold text-[var(--color-muted)]">Set a New Password</h2>
        
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
          <label className="flex flex-col gap-3 text-sm font-semibold" htmlFor="password">
            New Password:
            <div className="relative">
              <input 
                className={`h-14 w-full rounded-[14px] border bg-[var(--surface)] px-4 pr-14 text-sm text-[var(--color-ink)] outline-none transition focus:ring-4 focus:ring-[rgba(15,23,42,0.08)] disabled:opacity-50 ${
                  isPasswordTooShort ? 'border-red-500 focus:border-red-500' : 'border-[var(--color-line)] focus:border-[var(--color-ink)]'
                }`}
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={loading}
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition hover:text-[var(--color-ink)] disabled:opacity-50"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {isPasswordTooShort && <span className="text-xs text-red-500 font-medium">Password must be at least 6 characters long.</span>}
          </label>

          <label className="flex flex-col gap-3 text-sm font-semibold" htmlFor="confirmPassword">
            Confirm New Password:
            <input 
              className={`h-14 w-full rounded-[14px] border bg-[var(--surface)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:ring-4 focus:ring-[rgba(15,23,42,0.08)] disabled:opacity-50 ${
                isPasswordMismatch ? 'border-red-500 focus:border-red-500' : 'border-[var(--color-line)] focus:border-[var(--color-ink)]'
              }`}
              type={showPassword ? "text" : "password"} 
              id="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              disabled={loading}
            />
            {isPasswordMismatch && <span className="text-xs text-red-500 font-medium">The verification password does not match.</span>}
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
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}