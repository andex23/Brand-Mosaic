import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import BrandHeader from './BrandHeader';
import ErrorMessage from './ErrorMessage';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user, isConfigured, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp({
          email,
          password,
          fullName,
        });

        setInfo('Account created. If email confirmation is enabled, confirm your inbox and then sign in.');
      } else {
        await signIn({ email, password });
      }
    } catch (err: any) {
      console.error('Auth error:', err);

      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists.');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Password should be at least 6 characters.');
      } else if (err.message?.includes('Unable to validate email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper notepad-bg">
      <div className="brand-page home-container">
        <div className="nav-top-bar nav-top-bar-home">
          <span className="nav-top-spacer" aria-hidden="true"></span>
          <div className="nav-top-actions">
            <ThemeToggle />
          </div>
        </div>

        <BrandHeader subtitle="Private brand workbooks for founders and teams" />

        <div className="home-hero">
          <div className="home-tagline">"Work through your brand. Keep every draft in one place."</div>
          <div className="home-description">
            Brand Mosaic is a guided branding workbook for founders, creatives, and small teams who
            need sharper brand direction before they design, write, or ship.
          </div>
          <div className="home-supporting-note">
            Each account gets a private dashboard with saved workbooks, questionnaire answers, and
            generated brand results tied to that user only.
          </div>
        </div>

        <div className="home-process-board">
          <div className="home-process-title">How it works</div>
          <div className="home-process-steps">
            <div className="home-process-step">
              <span>01</span>
              <p>Answer questions about your brand</p>
            </div>
            <div className="home-process-step">
              <span>02</span>
              <p>Let Brand Mosaic synthesize the full picture</p>
            </div>
            <div className="home-process-step">
              <span>03</span>
              <p>Review, return, and export your saved direction</p>
            </div>
          </div>
        </div>

        <div className="home-workbook-card">
          <div className="home-workbook-title">What your workbook captures</div>
          <div className="home-workbook-list">
            <div className="home-workbook-item">→ A clear brand essence and positioning summary</div>
            <div className="home-workbook-item">→ Voice, personality, and messaging direction</div>
            <div className="home-workbook-item">→ Visual notes for palette, typography, and imagery</div>
            <div className="home-workbook-item">→ Persistent project history you can resume later</div>
          </div>
        </div>

        <div className="home-access-guide">
          <div className="home-access-guide-title">Before you begin</div>
          <div className="home-access-guide-list">
            <span>→ Sign in to keep each workbook private to your account.</span>
            <span>→ Your brand answers, results, and exports stay tied to the projects you own.</span>
            <span>→ Brand generation runs through the app’s server-side OpenAI → Gemini provider chain.</span>
          </div>
        </div>

        <form className="home-action-area" onSubmit={handleSubmit}>
          <div className="home-form-title">
            {isSignUp ? 'Create your private dashboard' : 'Return to your workbooks'}
          </div>
          <div className="home-form-note">
            {isSignUp
              ? 'Start with email and password. Your projects, answers, and results will stay under your account.'
              : 'Sign in to continue drafting, generating, and exporting your saved brand work.'}
          </div>

          {isSignUp && (
            <input
              type="text"
              className="home-email-input"
              placeholder="full name (optional)"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={loading}
            />
          )}

          <input
            type="email"
            className="home-email-input"
            placeholder="email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            className="home-email-input"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />

          {error && <ErrorMessage message={error} />}
          {info && <div className="home-inline-note">{info}</div>}

          <button
            type="submit"
            className="brand-submit-btn home-start-btn"
            disabled={loading || !isConfigured}
            style={{ opacity: isConfigured ? 1 : 0.5 }}
          >
            {loading
              ? '[ WORKING... ]'
              : isSignUp
                ? '[ CREATE ACCOUNT ]'
                : '[ SIGN IN ]'}
          </button>
        </form>

        <div className="home-features">
          <div className="home-feature-item">→ Private per-user workbooks</div>
          <div className="home-feature-item">→ Autosaved questionnaire progress</div>
          <div className="home-feature-item">→ Saved brand results and export history</div>
        </div>

        <div className="home-footer">
          {isConfigured ? (
            <button onClick={() => setIsSignUp((current) => !current)} className="nav-link-btn">
              {isSignUp ? 'Already have an account? Sign In' : 'New here? Create Account'}
            </button>
          ) : (
            <p className="home-cloud-disabled">
              Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable accounts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
