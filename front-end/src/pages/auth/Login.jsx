import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, resendVerification } from '../../config/auth'; 
import { supabase } from '../../config/SupabaseClient';
import './login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState(null); 
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');
    setLoading(true);

    try {
      const { user } = await signIn(email, password);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      switch (profile.role) {
        case 'supervisor': navigate('/dashboard/supervisor'); break;
        case 'technician': navigate('/dashboard/technician'); break;
        case 'admin': navigate('/dashboard/admin'); break;
        case 'staff': navigate('/dashboard/staff'); break;
        default: navigate('/');
      }
    } catch (err) {
      if (err.message === "EMAIL_NOT_CONFIRMED") {
        setError(
          <span>
            Your email is not verified yet. Check your inbox or{" "}
            <button
              type="button"
              onClick={handleResendEmail}
              style={{ textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}
            >
              click here to resend the confirmation link
            </button>.
          </span>
        );
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError(null);
    setLoading(true);
    try {
      await resendVerification(email);
      setSuccessMessage("A new verification link has been sent to your email inbox!");
    } catch (err) {
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Initiating Google Sign-In");
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h1 className="brand-logo">Tatua Sasa</h1>
        <h2>Login to your Account</h2>
        
        {/* Dynamic Alert Containers */}
        {error && (
          <div className="login-alert alert-error">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="login-alert alert-success">
            {successMessage}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            type="email"
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <div className="password-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={loading}
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Logging In...' : 'Log In'}
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <svg viewBox="0 0 48 48" width="20" height="20" style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="auth-links">
          <p>
            Forgot password? <a href="/auth/forgot-password" className="link">Reset</a>
          </p>
          <p>
            Are you signed up? <Link to="/auth/signup" className="link">Sign up</Link>
          </p>
        </div>
      </form>
    </div>
  );
}