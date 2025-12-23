import React, { useState } from 'react';
import BrandHeader from './BrandHeader';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface HomePageProps {
  onLocalStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLocalStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError("Cloud Sync is unavailable in this environment. Please use the local session below.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-api-key') {
        setError('Firebase API Key is invalid.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found.');
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

  const isFirebaseEnabled = !!auth;

  return (
    <div className="home-wrapper notepad-bg">
      <div className="brand-page home-container">
        <BrandHeader />

        <div className="home-hero">
          <div className="home-tagline">“Brand identity without the noise.”</div>
          
          <div className="home-description">
            A soft, quiet space to shape who<br />
            your brand is and how it feels.
          </div>
        </div>

        <form className="home-action-area" onSubmit={handleSubmit} style={{ maxWidth: '320px' }}>
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
            style={{ marginTop: '-16px' }}
            disabled={loading}
          />

          {error && (
            <div style={{ color: '#d32f2f', fontSize: '11px', fontStyle: 'italic', marginTop: '-12px', textAlign: 'center', lineHeight: '1.4' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="brand-submit-btn home-start-btn"
            disabled={loading || !isFirebaseEnabled}
            style={{ opacity: isFirebaseEnabled ? 1 : 0.5 }}
          >
            {loading ? '...' : (isSignUp ? '[ START YOUR BRAND → ]' : '[ ENTER DASHBOARD → ]')}
          </button>
        </form>

        <div className="home-features" style={{ marginTop: '42px' }}>
          <div className="home-feature-item">→ Thoughtful questions</div>
          <div className="home-feature-item">→ Clean brand summary</div>
          <div className="home-feature-item">→ Visual identity & tone mapping</div>
        </div>

        <div className="home-footer" style={{ marginTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {isFirebaseEnabled ? (
            <button onClick={toggleMode} className="nav-link-btn" style={{ fontSize: '14px' }}>
              {isSignUp ? 'Already have a brand? Sign In' : 'New here? Start a Brand'}
            </button>
          ) : (
            <div style={{ fontSize: '12px', opacity: 0.5, fontStyle: 'italic' }}>
              Cloud sync is disabled.
            </div>
          )}

          <button 
            onClick={onLocalStart} 
            className="nav-link-btn"
            style={{ fontSize: '14px', marginTop: '8px' }}
          >
            CONTINUE WITHOUT CLOUD SYNC
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;