import React, { useState } from 'react';
import BrandHeader from './BrandHeader';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ErrorMessage from './ErrorMessage';

interface HomePageProps {
  onLocalStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLocalStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabase) {
      setError("Cloud Sync is unavailable in this environment. Please use the local session below.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // If email confirmations are enabled, let user know
        if (data.user && !data.session) {
          setError('Please check your email to confirm your account.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Map Supabase errors to user-friendly messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email address.');
      } else if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists.');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Password should be at least 6 characters.');
      } else if (err.message?.includes('Unable to validate email')) {
        setError('Please enter a valid email address.');
      } else if (err.message?.includes('email') && err.message?.includes('send')) {
        setError('Email service error. Check Supabase SMTP settings or disable email confirmation for testing.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setPassword('');
  };

  const isCloudEnabled = isSupabaseConfigured();

  const isValidApiKeyFormat = (key: string): boolean => {
    // Basic validation: check if it looks like a Gemini API key
    return key.trim().length > 20 && key.startsWith('AIza');
  };

  const handleLocalStart = () => {
    if (showApiKeyInput) {
      if (!apiKey.trim()) {
        setError('Please enter your Gemini API key to use local mode.');
        return;
      }
      if (!isValidApiKeyFormat(apiKey)) {
        setError('Invalid API key format. Gemini API keys start with "AIza".');
        return;
      }
      
      // Store API key securely in localStorage
      localStorage.setItem('user_gemini_api_key', apiKey);
      onLocalStart();
    } else {
      setShowApiKeyInput(true);
    }
  };

  return (
    <div className="home-wrapper notepad-bg">
      <div className="brand-page home-container">
        <BrandHeader />

        <div className="home-hero">
          <div className="home-tagline">"Brand identity without the noise."</div>
          
          <div className="home-description">
            A soft, quiet space to shape who<br />
            your brand is and how it feels.
          </div>
        </div>

        {!showApiKeyInput ? (
          <form className="home-action-area" onSubmit={handleSubmit}>
            <input 
              type="email" 
              className="home-email-input"
              placeholder="email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            
            <input 
              type="password" 
              className="home-email-input"
              placeholder="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            {error && <ErrorMessage message={error} />}

            <button 
              type="submit" 
              className="brand-submit-btn home-start-btn"
              disabled={loading || !isCloudEnabled}
              style={{ opacity: isCloudEnabled ? 1 : 0.5 }}
            >
              {loading ? '...' : (isSignUp ? '[ START YOUR BRAND → ]' : '[ ENTER DASHBOARD → ]')}
            </button>
          </form>
        ) : (
          <div className="home-action-area">
            <div className="local-mode-header">
              <strong>Local Mode</strong>
              <p className="local-mode-desc">
                Enter your Google Gemini API key to use the app locally without cloud sync.
              </p>
            </div>
            
            <input 
              type="password" 
              className="home-email-input"
              placeholder="your gemini api key (AIza...)" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            {error && <ErrorMessage message={error} />}

            <button 
              onClick={handleLocalStart}
              className="brand-submit-btn home-start-btn"
            >
              [ START LOCAL SESSION → ]
            </button>

            <button 
              onClick={() => {
                setShowApiKeyInput(false);
                setApiKey('');
                setError('');
              }}
              className="nav-link-btn home-back-btn"
            >
              ← BACK TO SIGN IN
            </button>
          </div>
        )}

        {!showApiKeyInput && (
          <>
            <div className="home-features">
              <div className="home-feature-item">→ Thoughtful questions</div>
              <div className="home-feature-item">→ Clean brand summary</div>
              <div className="home-feature-item">→ Visual identity & tone mapping</div>
            </div>

            <div className="home-footer">
              {isCloudEnabled ? (
                <button onClick={toggleMode} className="nav-link-btn">
                  {isSignUp ? 'Already have a brand? Sign In' : 'New here? Start a Brand'}
                </button>
              ) : (
                <p className="home-cloud-disabled">Cloud sync is disabled.</p>
              )}

              <button onClick={handleLocalStart} className="nav-link-btn">
                CONTINUE WITHOUT CLOUD SYNC
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;