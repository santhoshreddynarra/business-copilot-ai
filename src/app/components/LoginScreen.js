'use client';

import { useState } from 'react';
import { Key, ArrowRight, Lock, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Github } from './icons';

export default function LoginScreen({ onLoginPat, oauthLoading, errorMsg }) {
  const [pat, setPat] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [patLoading, setPatLoading] = useState(false);
  const [patError, setPatError] = useState('');

  const handlePatSubmit = async (e) => {
    e.preventDefault();
    setPatError('');

    if (!pat.trim()) {
      setPatError('Please enter a Personal Access Token');
      return;
    }

    setPatLoading(true);
    try {
      // Validate the token by querying /user through our api proxy
      const response = await fetch('/api/github?path=user', {
        headers: {
          'Authorization': `Bearer ${pat.trim()}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token. Please check the permissions and try again.');
      }

      const userData = await response.json();
      
      // Store in localStorage for session persistence
      localStorage.setItem('github_pat_token', pat.trim());
      
      onLoginPat({
        authenticated: true,
        authMethod: 'pat',
        token: pat.trim(),
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          public_repos: userData.public_repos,
          followers: userData.followers,
          following: userData.following,
        }
      });
    } catch (err) {
      setPatError(err.message || 'Verification failed. Make sure your network is active and token is valid.');
    } finally {
      setPatLoading(false);
    }
  };

  const handleOAuthClick = () => {
    window.location.href = '/api/auth/github';
  };

  return (
    <div style={styles.container}>
      {/* Decorative ambient lighting elements */}
      <div className="ambient-bg">
        <div className="ambient-light-1" />
        <div className="ambient-light-2" />
      </div>

      <div style={styles.card} className="glass-card">
        {/* Top Branding */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Github size={40} className="purple-gradient-text" style={styles.logo} />
          </div>
          <h1 style={styles.title}>
            <span className="rainbow-gradient-text">Business Copilot AI</span>
          </h1>
          <p style={styles.subtitle}>Supercharge your GitHub workflows with AI-powered code audits and project analytics.</p>
        </div>

        {errorMsg && (
          <div style={styles.errorBanner}>
            <AlertCircle size={18} style={styles.errorIcon} />
            <span>
              {errorMsg === 'missing_oauth_config' 
                ? 'OAuth App credentials are not configured in .env.local yet. Please use the PAT option below to log in immediately!' 
                : errorMsg}
            </span>
          </div>
        )}

        {/* OAuth flow button */}
        <div style={styles.section}>
          <button 
            onClick={handleOAuthClick} 
            style={styles.oauthBtn} 
            className="btn-primary"
            disabled={oauthLoading}
          >
            {oauthLoading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <Github size={20} />
            )}
            <span>Sign in with GitHub (OAuth)</span>
            <ArrowRight size={16} />
          </button>
          <p style={styles.infoText}>
            Secure authentication standard. Reauthorizes on each session.
          </p>
        </div>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>OR LOGIN VIA TOKEN</span>
          <div style={styles.dividerLine}></div>
        </div>

        {/* PAT flow form */}
        <form onSubmit={handlePatSubmit} style={styles.section}>
          <div style={styles.inputContainer}>
            <div style={styles.inputWrapper}>
              <Key style={styles.inputIcon} size={18} />
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxx"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                style={styles.patInput}
                className="input-field"
                disabled={patLoading}
              />
            </div>
            {patError && <span style={styles.validationError}>{patError}</span>}
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn} 
            className="btn-secondary"
            disabled={patLoading}
          >
            {patLoading ? (
              <Loader2 className="spinner" size={18} />
            ) : (
              <Lock size={16} />
            )}
            <span>Connect using PAT</span>
          </button>

          {/* PAT instruction details toggle */}
          <div style={styles.instructionToggleContainer}>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              style={styles.instructionLink}
            >
              How do I get a Personal Access Token?
              <ExternalLink size={12} style={{ marginLeft: 4 }} />
            </button>
          </div>

          {showInstructions && (
            <div style={styles.instructionsBox} className="glass-card">
              <ol style={styles.instructionsList}>
                <li>Go to GitHub's <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={styles.externalLink}>Developer Token Settings</a>.</li>
                <li>Click <strong>Generate new token (classic)</strong>.</li>
                <li>Set a note (e.g., <em>Business Copilot AI</em>) and pick scopes:
                  <ul style={styles.nestedList}>
                    <li><code>repo</code> (Full control of private & public repositories)</li>
                    <li><code>read:user</code> (Read profile details)</li>
                  </ul>
                </li>
                <li>Click **Generate token** and copy-paste the token key above!</li>
              </ol>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: '#07070a',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  logoContainer: {
    width: '72px',
    height: '72px',
    borderRadius: '18px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8px',
    boxShadow: '0 8px 24px -6px rgba(139, 92, 246, 0.3)',
  },
  logo: {
    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.5',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#f87171',
    fontSize: '13px',
    textAlign: 'left',
    lineHeight: '1.4',
  },
  errorIcon: {
    flexShrink: 0,
    marginTop: '2px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  oauthBtn: {
    width: '100%',
    justifyContent: 'center',
    fontSize: '15px',
    height: '48px',
  },
  infoText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: '#4b5563',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  dividerLine: {
    flexGrow: 1,
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dividerText: {
    whiteSpace: 'nowrap',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
    pointerEvents: 'none',
  },
  patInput: {
    paddingLeft: '44px',
    height: '46px',
  },
  validationError: {
    color: '#f87171',
    fontSize: '12px',
    textAlign: 'left',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    height: '46px',
    fontSize: '15px',
  },
  instructionToggleContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  instructionLink: {
    background: 'none',
    border: 'none',
    color: '#8b5cf6',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
    fontWeight: '500',
    transition: 'color 0.2s',
    outline: 'none',
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  instructionsList: {
    paddingLeft: '18px',
    color: '#9ca3af',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  nestedList: {
    paddingLeft: '16px',
    margin: '4px 0',
    listStyleType: 'disc',
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  externalLink: {
    color: '#06b6d4',
    textDecoration: 'underline',
  }
};
