import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../config/auth';
import './login.css'; // Importing your custom CSS

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // State for Feedback Mechanisms
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); 
  const [loading, setLoading] = useState(false);           
  const [validationTriggered, setValidationTriggered] = useState(false); 

  // Client-side quick checks for visual styling
  const isPasswordMismatch = validationTriggered && password !== confirmPassword;
  const isPasswordTooShort = validationTriggered && password.length > 0 && password.length < 6;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setValidationTriggered(true);
    
    // Form Validation Guard
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      setError("Password is too short! Must be at least 6 characters.");
      return;
    }
    
    setLoading(true); 
    
    try {
      const response = await signUp(email, password, name);
      console.log("Sign up successful:", response);
      
      // Explicitly prompt the user to check their email
      setSuccessMessage("Account created successfully! Please check your email inbox to confirm your account."); 
      
      // Give them a bit more time (e.g., 4 seconds) to read it before routing away
      setTimeout(() => {
        navigate('/'); 
      }, 4000);
      
    } catch (err) {
      // Validation and Error Handling mapping
      if (err.status === 409 || err.message?.includes('already in use')) {
        setError("An account with this email address already exists. Please log in.");
      } else if (err.status === 500 || err.message?.includes('network')) {
        setError("Something went wrong. Please try again later.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSignUp}>
        <h1 className="brand-logo">Tatua Sasa</h1>
        <h2>Create an Account</h2>

        {/* Visual error container feedback */}
        {error && (
          <div style={{ color: '#a40606', backgroundColor: '#ffeaea', padding: '12px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontSize: '14px', border: '1px solid #ffcaca' }}>
            {error}
          </div>
        )}
        
        {/* Success State Alert Container */}
        {successMessage && (
          <div style={{ color: '#057840', backgroundColor: '#e6f4ea', padding: '12px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center', fontSize: '14px', border: '1px solid #bce8cb' }}>
            {successMessage}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

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
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={isPasswordTooShort ? { borderColor: '#a40606' } : {}}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isPasswordTooShort && <span style={{ color: '#a40606', fontSize: '12px', marginTop: '4px', display: 'block' }}>Password must be at least 6 characters long.</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              style={isPasswordMismatch ? { borderColor: '#a40606' } : {}}
            />
          </div>
          {isPasswordMismatch && <span style={{ color: '#a40606', fontSize: '12px', marginTop: '4px', display: 'block' }}>The verification password does not match.</span>}
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="google-btn"
          onClick={() => console.log("Google Sign Up Clicked")}
          disabled={loading}
        >
          <svg viewBox="0 0 48 48" width="20" height="20">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Sign up with Google
        </button>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <div className="auth-links">
          <p>
            Already have an account? <Link to="/" className="link">Log In</Link>
          </p>
        </div>
      </form>
    </div>
  );
}