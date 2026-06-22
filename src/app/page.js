'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle any redirect query parameters
  useEffect(() => {
    // We use a safe standard parsing since searchParams can be obtained on mount
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setErrorMsg(errorParam);
      // Clean URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check auth session on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Try OAuth status check
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const authData = await response.json();
          if (authData.authenticated) {
            setSession({
              authenticated: true,
              authMethod: 'oauth',
              token: null, // Token stays securely in the HttpOnly cookie
              user: authData.user,
            });
            setLoading(false);
            return;
          }
        }

        // 2. Try Fallback: local storage PAT token validation
        const localPat = localStorage.getItem('github_pat_token');
        if (localPat) {
          const patVerifyResponse = await fetch('/api/github?path=user', {
            headers: {
              Authorization: `Bearer ${localPat}`,
            },
          });

          if (patVerifyResponse.ok) {
            const userData = await patVerifyResponse.json();
            setSession({
              authenticated: true,
              authMethod: 'pat',
              token: localPat,
              user: {
                login: userData.login,
                name: userData.name || userData.login,
                avatar_url: userData.avatar_url,
                bio: userData.bio,
                public_repos: userData.public_repos,
                followers: userData.followers,
                following: userData.following,
              },
            });
          } else {
            // Stale or invalid PAT in storage
            localStorage.removeItem('github_pat_token');
          }
        }
      } catch (err) {
        console.error('Session loading failed', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (session?.authMethod === 'oauth') {
        await fetch('/api/auth/status', { method: 'POST' });
      } else {
        localStorage.removeItem('github_pat_token');
      }
    } catch (err) {
      console.error('Error logging out', err);
    } finally {
      setSession(null);
      setLoading(false);
    }
  };

  const handleLoginPat = (patSession) => {
    setSession(patSession);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} />
        <span style={styles.loadingText}>Initializing Business Copilot...</span>
      </div>
    );
  }

  if (session?.authenticated) {
    return (
      <Dashboard 
        session={session} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <LoginScreen 
      onLoginPat={handleLoginPat} 
      oauthLoading={oauthLoading} 
      errorMsg={errorMsg}
    />
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#07070a',
    gap: '16px',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'var(--font-sans)',
  },
};
