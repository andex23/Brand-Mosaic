import React, { useState } from 'react';
import BrandHeader from './BrandHeader';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ErrorMessage from './ErrorMessage';

export type EntryPath = 'brand' | 'photo-studio';

interface HomePageProps {
  onLocalStart: (path?: EntryPath) => void;
  onAuthSuccess?: (path: EntryPath) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLocalStart, onAuthSuccess }) => {
  // Path selection
  const [selectedPath, setSelectedPath] = useState<EntryPath | null>(null);

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyValue, setShowApiKeyValue] = useState(false);

  const isCloudEnabled = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabase) {
      setError("Cloud Sync is unavailable. Please use the local session below.");
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

      // Signal the intended path to App.tsx
      if (selectedPath && onAuthSuccess) {
        onAuthSuccess(selectedPath);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
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
        setError('Email service error. Check Supabase SMTP settings.');
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

  const isValidApiKeyFormat = (key: string): boolean => {
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
      localStorage.setItem('user_gemini_api_key', apiKey);
      onLocalStart(selectedPath || 'brand');
    } else {
      setShowApiKeyInput(true);
    }
  };

  const handleBackToPathSelection = () => {
    setSelectedPath(null);
    setShowApiKeyInput(false);
    setApiKey('');
    setError('');
    setEmail('');
    setPassword('');
  };

  // ── LANDING VIEW: Path Selection ──────────────────

  if (!selectedPath) {
    return (
      <div className="home-wrapper notepad-bg">
        <div className="brand-page home-container">
          <BrandHeader />

          <div className="home-hero">
            <div className="home-tagline">"Create with intention."</div>
            <div className="home-description">
              Brand identity and product photography<br />
              — in one quiet, opinionated space.
            </div>
          </div>

          {/* Two Path Selectors */}
          <div className="home-path-grid">
            <div
              className="home-path-card"
              onClick={() => setSelectedPath('brand')}
            >
              <div className="home-path-icon">&#9670;</div>
              <div className="home-path-label">Brand Mosaic</div>
              <div className="home-path-desc">
                Shape your brand identity — tone, palette, typography,
                archetype. Answer questions, get a complete brand kit.
              </div>
              <div className="home-path-features">
                <span>&#8594; Brand questionnaire</span>
                <span>&#8594; AI brand kit generation</span>
                <span>&#8594; Visual direction & tone</span>
                <span>&#8594; Logo prompt</span>
              </div>
              <div className="home-path-cta">[ START YOUR BRAND ]</div>
            </div>

            <div
              className="home-path-card"
              onClick={() => setSelectedPath('photo-studio')}
            >
              <div className="home-path-icon">&#9671;</div>
              <div className="home-path-label">Photo Studio</div>
              <div className="home-path-desc">
                Generate product photography scenes — studio, lifestyle,
                editorial. Upload a product, pick scenes, get images.
              </div>
              <div className="home-path-features">
                <span>&#8594; Product image upload</span>
                <span>&#8594; 3 scene types</span>
                <span>&#8594; Mood interpretation</span>
                <span>&#8594; Brand-grade output</span>
              </div>
              <div className="home-path-cta">[ OPEN PHOTO STUDIO ]</div>
            </div>
          </div>

          <div className="home-footer">
            <div className="home-footer-note">
              Both tools work together or independently.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTH VIEW: Sign In / Sign Up / Local ──────────

  const pathLabel = selectedPath === 'brand' ? 'Brand Mosaic' : 'Photo Studio';

  return (
    <div className="home-wrapper notepad-bg">
      <div className="brand-page home-container">
        <BrandHeader subtitle={pathLabel} />

        <div className="home-hero">
          <div className="home-tagline">
            {selectedPath === 'brand'
              ? '"Brand identity without the noise."'
              : '"Product photography, restaged by AI."'}
          </div>
          <div className="home-description">
            {selectedPath === 'brand'
              ? <>A soft, quiet space to shape who<br />your brand is and how it feels.</>
              : <>Upload a product, pick scenes, add mood.<br />The system handles the rest.</>}
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
              {loading
                ? '...'
                : isSignUp
                ? '[ CREATE ACCOUNT → ]'
                : '[ SIGN IN → ]'}
            </button>
          </form>
        ) : (
          <div className="home-action-area">
            <div className="local-mode-header">
              <strong>Local Mode</strong>
              <p className="local-mode-desc">
                Enter your Google Gemini API key to use locally without cloud sync.
              </p>
            </div>

            <div className="api-key-input-wrap">
              <input
                type={showApiKeyValue ? 'text' : 'password'}
                className="home-email-input"
                placeholder="your gemini api key (AIza...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="api-key-toggle"
                onClick={() => setShowApiKeyValue(!showApiKeyValue)}
                title={showApiKeyValue ? 'Hide key' : 'Show key'}
              >
                {showApiKeyValue ? '[ HIDE ]' : '[ SHOW ]'}
              </button>
            </div>

            {error && <ErrorMessage message={error} />}

            <button
              onClick={handleLocalStart}
              className="brand-submit-btn home-start-btn"
            >
              [ START LOCAL SESSION → ]
            </button>

            <button
              onClick={() => { setShowApiKeyInput(false); setApiKey(''); setError(''); }}
              className="nav-link-btn home-back-btn"
            >
              ← BACK TO SIGN IN
            </button>
          </div>
        )}

        {!showApiKeyInput && (
          <>
            <div className="home-features">
              {selectedPath === 'brand' ? (
                <>
                  <div className="home-feature-item">→ Thoughtful questions</div>
                  <div className="home-feature-item">→ Clean brand summary</div>
                  <div className="home-feature-item">→ Visual identity & tone mapping</div>
                </>
              ) : (
                <>
                  <div className="home-feature-item">→ Studio, lifestyle, editorial scenes</div>
                  <div className="home-feature-item">→ Mood-driven scene interpretation</div>
                  <div className="home-feature-item">→ Download-ready product imagery</div>
                </>
              )}
            </div>

            <div className="home-footer">
              {isCloudEnabled ? (
                <button onClick={toggleMode} className="nav-link-btn">
                  {isSignUp ? 'Already have an account? Sign In' : 'New here? Create Account'}
                </button>
              ) : (
                <p className="home-cloud-disabled">Cloud sync is disabled.</p>
              )}

              <button onClick={handleLocalStart} className="nav-link-btn">
                CONTINUE WITHOUT CLOUD SYNC
              </button>

              <button onClick={handleBackToPathSelection} className="nav-link-btn home-switch-path">
                ← Choose a different tool
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
