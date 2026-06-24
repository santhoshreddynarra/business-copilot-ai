'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  LogOut, Search, Star, GitFork, Sparkles, BookOpen, 
  ChevronRight, Info, RefreshCw, AlertTriangle, CheckCircle2, 
  FolderGit2, Calendar, Users, BarChart3, Globe, Code,
  Shield, ShieldAlert, Clock, GitBranch, Lock, Unlock, Loader2
} from 'lucide-react';
import { Github } from './icons';

export default function Dashboard({ session, onLogout }) {
  const { user, token, authMethod } = session;
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState('repositories'); // 'repositories', 'auditor', 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'stars', 'forks'
  
  // Auditor states
  const [selectedRepoName, setSelectedRepoName] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [auditorSubTab, setAuditorSubTab] = useState('overview'); // 'overview', 'commits', 'branches'

  // Fetch repositories from API proxy
  const fetchRepos = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = {};
      if (authMethod === 'pat' && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/github?path=user/repos&sort=updated&per_page=100', {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to load repositories');
      }

      const data = await response.json();
      setRepos(data);
      if (data.length > 0) {
        setSelectedRepoName(data[0].name);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve repository information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute stats for analytics
  const stats = useMemo(() => {
    if (!repos.length) return { stars: 0, forks: 0, languages: {}, publicCount: 0 };
    
    let stars = 0;
    let forks = 0;
    const languages = {};
    
    repos.forEach(repo => {
      stars += repo.stargazers_count || 0;
      forks += repo.forks_count || 0;
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    // Sort languages by occurrence
    const sortedLangs = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});

    return {
      stars,
      forks,
      languages: sortedLangs,
      publicCount: repos.filter(r => !r.private).length,
      privateCount: repos.filter(r => r.private).length
    };
  }, [repos]);

  // Filter and sort repositories
  const filteredRepos = useMemo(() => {
    return repos
      .filter(repo => {
        const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesLang = !langFilter || repo.language === langFilter;
        return matchesSearch && matchesLang;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        if (sortBy === 'forks') return b.forks_count - a.forks_count;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
  }, [repos, searchQuery, langFilter, sortBy]);

  const uniqueLanguages = useMemo(() => {
    const langs = new Set();
    repos.forEach(r => r.language && langs.add(r.language));
    return Array.from(langs);
  }, [repos]);

  // Run AI Audit on the selected repository
  const runAiAudit = async (repoName) => {
    if (!repoName) return;
    setAuditLoading(true);
    setAuditReport(null);
    setAuditorSubTab('overview');
    
    try {
      const repo = repos.find(r => r.name === repoName);
      if (!repo) throw new Error('Repository details not found');

      const headers = {};
      if (authMethod === 'pat' && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Fetch README check from GitHub via proxy
      let hasReadme = false;
      let readmeSize = 0;
      let readmeInstallGuide = false;
      
      try {
        const readmeRes = await fetch(`/api/github?path=repos/${repo.owner.login}/${repoName}/readme`, {
          headers
        });
        
        if (readmeRes.ok) {
          const readmeData = await readmeRes.json();
          hasReadme = true;
          readmeSize = readmeData.size || 0;
          // Retrieve README base64 text and decode it to search for install keywords
          if (readmeData.content) {
            const content = atob(readmeData.content.replace(/\s/g, ''));
            readmeInstallGuide = /install|npm install|yarn add|pip install|docker|setup/gi.test(content);
          }
        }
      } catch (readmeErr) {
        // Readme doesn't exist, which is a key audit insight!
      }

      // 2. Fetch branches check from GitHub via proxy
      let branches = [];
      let defaultBranchProtected = false;
      try {
        const branchesRes = await fetch(`/api/github?path=repos/${repo.owner.login}/${repoName}/branches`, {
          headers
        });
        if (branchesRes.ok) {
          branches = await branchesRes.json();
          const defaultBranchName = repo.default_branch || 'main';
          const defaultBranch = branches.find(b => b.name === defaultBranchName);
          if (defaultBranch) {
            defaultBranchProtected = !!defaultBranch.protected;
          }
        }
      } catch (branchesErr) {
        console.error('Branches fetch failed', branchesErr);
      }

      // 3. Fetch recent commits check from GitHub via proxy
      let commits = [];
      try {
        const commitsRes = await fetch(`/api/github?path=repos/${repo.owner.login}/${repoName}/commits&per_page=15`, {
          headers
        });
        if (commitsRes.ok) {
          commits = await commitsRes.json();
        }
      } catch (commitsErr) {
        console.error('Commits fetch failed', commitsErr);
      }

      // Generate AI Insights from repo metadata
      const issuesCount = repo.open_issues_count || 0;
      const daysSinceUpdate = Math.round((new Date() - new Date(repo.updated_at)) / (1000 * 60 * 60 * 24));
      
      const findings = [];
      let score = 100;

      // Rule-based audit score calculation
      if (!hasReadme) {
        findings.push({
          type: 'danger',
          category: 'Documentation',
          message: 'Missing README.md file in the root. A README is critical for developers and onboarding.',
          fix: 'Create a README.md file highlighting the project purpose, requirements, and steps to run.'
        });
        score -= 30;
      } else if (!readmeInstallGuide) {
        findings.push({
          type: 'warning',
          category: 'Documentation',
          message: 'README.md exists but lacks explicit installation or startup instructions.',
          fix: 'Add a "Getting Started" or "Installation" section detailing how to launch the project.'
        });
        score -= 10;
      }

      if (issuesCount > 15) {
        findings.push({
          type: 'warning',
          category: 'Maintenance',
          message: `High volume of open issues/PRs (${issuesCount}). This might indicate review backlogs.`,
          fix: 'Audit open issues, close stale items, or group them into Milestones for structured planning.'
        });
        score -= 15;
      }

      if (daysSinceUpdate > 90) {
        findings.push({
          type: 'warning',
          category: 'Activity',
          message: `Stale codebase. No commits or updates recorded in the last ${daysSinceUpdate} days.`,
          fix: 'Perform a review of dependency vulnerabilities or archive the repository if it is no longer maintained.'
        });
        score -= 15;
      } else if (daysSinceUpdate <= 7) {
        findings.push({
          type: 'success',
          category: 'Activity',
          message: 'Highly active repository! Regular updates detected within the last week.',
          fix: 'Keep maintaining the active flow of pull requests and updates.'
        });
      }

      if (repo.has_issues === false) {
        findings.push({
          type: 'info',
          category: 'Community',
          message: 'GitHub Issues are disabled for this repository.',
          fix: 'If this is an open-source or team project, consider enabling issues in repository settings.'
        });
      }

      if (!repo.license) {
        findings.push({
          type: 'info',
          category: 'Compliance',
          message: 'No open-source License configured.',
          fix: 'Add a LICENSE file (e.g. MIT, Apache 2.0) to explicitly dictate code usage rights.'
        });
        score -= 5;
      } else {
        findings.push({
          type: 'success',
          category: 'Compliance',
          message: `License configured: ${repo.license.name || repo.license.spdx_id}`,
          fix: 'Ensure compliance requirements match your organization policies.'
        });
      }

      // Branch findings
      if (branches.length > 0) {
        if (!defaultBranchProtected) {
          findings.push({
            type: 'danger',
            category: 'Security',
            message: `Branch protection is disabled on the default branch "${repo.default_branch || 'main'}". This leaves the codebase vulnerable to force-pushes and accidental deletions.`,
            fix: 'Navigate to Settings > Branches on GitHub and add a branch protection rule for the default branch.'
          });
          score -= 20;
        } else {
          findings.push({
            type: 'success',
            category: 'Security',
            message: `Branch protection is active on default branch "${repo.default_branch || 'main'}".`,
            fix: 'Good governance and secure branching policy maintained.'
          });
        }

        if (branches.length > 5) {
          findings.push({
            type: 'warning',
            category: 'Git Standards',
            message: `High count of active branches (${branches.length} branches). Stale or unmerged remote branches can delay integration cycles.`,
            fix: 'Clean up stale branches or integrate pull requests to keep the branch count low.'
          });
          score -= 5;
        }
      }

      // Commit findings
      let compliancePercentage = 100;
      if (commits.length > 0) {
        const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|build|ci|perf)(\(.+\))?!?:.+$|^(Initial commit|Merge branch)/i;
        let conventionalCount = 0;
        let shortCommitCount = 0;

        commits.forEach(c => {
          const msg = c.commit?.message || '';
          if (conventionalRegex.test(msg)) {
            conventionalCount++;
          }
          if (msg.trim().length < 10) {
            shortCommitCount++;
          }
        });

        compliancePercentage = Math.round((conventionalCount / commits.length) * 100);

        if (compliancePercentage < 60) {
          findings.push({
            type: 'warning',
            category: 'Git Standards',
            message: `Low conventional commit compliance (${compliancePercentage}%). Standard commit messages (e.g. feat:, fix:) enable automated release notes and quality tracking.`,
            fix: 'Implement commit message linting and establish guidelines for using conventional commit tags.'
          });
          score -= 10;
        } else {
          findings.push({
            type: 'success',
            category: 'Git Standards',
            message: `Solid commit quality. ${compliancePercentage}% of recent commits follow conventional conventions.`,
            fix: 'Maintain current developer guidelines for commit formatting.'
          });
        }

        if (shortCommitCount > 2) {
          findings.push({
            type: 'info',
            category: 'Git Standards',
            message: `Detected ${shortCommitCount} recent commits with extremely short descriptions.`,
            fix: 'Encourage descriptive commit descriptions containing context or ticket references.'
          });
        }
      }

      // Add a default positive finding if score is high
      if (score >= 90 && findings.filter(f => f.type === 'success').length === 0) {
        findings.push({
          type: 'success',
          category: 'Quality',
          message: 'Repository follows core best practices. Standard structure and documentation look solid.',
          fix: 'No immediate fixes required. Keep up the clean structure!'
        });
      }

      setAuditReport({
        repoName,
        score: Math.max(score, 10),
        findings,
        updatedAt: new Date().toLocaleTimeString(),
        description: repo.description || 'No description provided.',
        branches,
        commits,
        defaultBranchProtected,
        compliancePercentage
      });

    } catch (err) {
      console.error(err);
      setError('Failed to generate audit report.');
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Ambient backgrounds */}
      <div className="ambient-bg">
        <div className="ambient-light-1" />
        <div className="ambient-light-2" />
      </div>

      {/* Sidebar navigation */}
      <aside style={styles.sidebar} className="glass-card">
        <div style={styles.userProfile}>
          <div style={styles.avatarWrapper}>
            <img 
              src={user.avatar_url} 
              alt={user.login} 
              style={styles.avatar} 
            />
            <div style={styles.badge} title={`Logged in via ${authMethod.toUpperCase()}`}>
              {authMethod === 'oauth' ? <Globe size={12} /> : <Code size={12} />}
            </div>
          </div>
          <div style={styles.profileText}>
            <h3 style={styles.userName}>{user.name}</h3>
            <span style={styles.userLogin}>@{user.login}</span>
            {user.bio && <p style={styles.userBio}>{user.bio}</p>}
          </div>
        </div>

        <div style={styles.userFollows}>
          <div style={styles.followItem}>
            <Users size={14} style={{ color: '#06b6d4' }} />
            <span><strong>{user.followers}</strong> followers</span>
          </div>
          <div style={styles.followItem}>
            <FolderGit2 size={14} style={{ color: '#8b5cf6' }} />
            <span><strong>{user.public_repos}</strong> repos</span>
          </div>
        </div>

        <div style={styles.menuDivider} />

        <nav style={styles.navigation}>
          <button 
            style={{
              ...styles.navItem,
              ...(activeTab === 'repositories' ? styles.navItemActive : {})
            }}
            onClick={() => setActiveTab('repositories')}
          >
            <FolderGit2 size={18} />
            <span>Repositories</span>
          </button>
          
          <button 
            style={{
              ...styles.navItem,
              ...(activeTab === 'auditor' ? styles.navItemActive : {})
            }}
            onClick={() => {
              setActiveTab('auditor');
              if (selectedRepoName && !auditReport) {
                runAiAudit(selectedRepoName);
              }
            }}
          >
            <Sparkles size={18} />
            <span>AI Copilot Auditor</span>
          </button>

          <button 
            style={{
              ...styles.navItem,
              ...(activeTab === 'analytics' ? styles.navItemActive : {})
            }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={18} />
            <span>Analytics Insights</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={onLogout} style={styles.logoutBtn} className="btn-secondary">
            <LogOut size={16} />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {error && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button onClick={fetchRepos} style={styles.retryBtn}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Tab 1: Repository Browser */}
        {activeTab === 'repositories' && (
          <div style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2 style={styles.pageTitle}>Repository Hub</h2>
                <p style={styles.pageSubtitle}>Browse, filter, and audit your linked GitHub codebase.</p>
              </div>
              <button onClick={fetchRepos} style={styles.refreshBtn} title="Refresh Repositories" disabled={loading}>
                <RefreshCw size={16} className={loading ? 'spinner' : ''} />
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div style={styles.searchBarContainer} className="glass-card">
              <div style={styles.searchWrapper}>
                <Search size={18} style={styles.searchIcon} />
                <input 
                  type="text"
                  placeholder="Search repository names or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                  className="input-field"
                />
              </div>

              <div style={styles.filtersWrapper}>
                <select 
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  style={styles.filterSelect}
                  className="input-field"
                >
                  <option value="">All Languages</option>
                  {uniqueLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>

                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={styles.filterSelect}
                  className="input-field"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="stars">Most Stars</option>
                  <option value="forks">Most Forks</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={styles.loaderBox}>
                <Loader2 className="spinner" size={40} />
                <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Loading GitHub repositories...</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div style={styles.emptyState} className="glass-card">
                <Info size={40} style={{ color: 'var(--text-muted)' }} />
                <h3>No Repositories Found</h3>
                <p>Try adjustments to your search query or filters.</p>
              </div>
            ) : (
              <div style={styles.repoGrid}>
                {filteredRepos.map(repo => (
                  <div key={repo.id} style={styles.repoCard} className="glass-card">
                    <div style={styles.repoCardHeader}>
                      <h4 style={styles.repoName}>
                        <a href={repo.html_url} target="_blank" rel="noreferrer" style={styles.repoLink}>
                          {repo.name}
                        </a>
                      </h4>
                      <span style={repo.private ? styles.badgePrivate : styles.badgePublic}>
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>

                    <p style={styles.repoDescription}>
                      {repo.description || 'No description specified for this repository.'}
                    </p>

                    <div style={styles.repoCardFooter}>
                      <div style={styles.repoMetaLeft}>
                        {repo.language && (
                          <span style={styles.repoLanguage}>
                            <span style={{ 
                              ...styles.languageDot, 
                              backgroundColor: getLanguageColor(repo.language) 
                            }} />
                            {repo.language}
                          </span>
                        )}
                        <span style={styles.metaItem}>
                          <Star size={14} style={styles.metaIcon} />
                          {repo.stargazers_count}
                        </span>
                        <span style={styles.metaItem}>
                          <GitFork size={14} style={styles.metaIcon} />
                          {repo.forks_count}
                        </span>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedRepoName(repo.name);
                          setActiveTab('auditor');
                          runAiAudit(repo.name);
                        }}
                        style={styles.auditActionBtn}
                        title="Run AI Audit"
                      >
                        <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                        <span>Audit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Copilot Auditor */}
        {activeTab === 'auditor' && (
          <div style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2 style={styles.pageTitle}>AI Copilot Auditor</h2>
                <p style={styles.pageSubtitle}>Analyze code governance, security checklists, and documentation levels.</p>
              </div>
            </div>

            <div style={styles.auditorSetup} className="glass-card">
              <label style={styles.selectLabel}>Select Repository to Audit:</label>
              <div style={styles.auditorSelectorRow}>
                <select 
                  value={selectedRepoName}
                  onChange={(e) => setSelectedRepoName(e.target.value)}
                  style={styles.repoSelectInput}
                  className="input-field"
                  disabled={auditLoading}
                >
                  {repos.map(repo => (
                    <option key={repo.id} value={repo.name}>{repo.name}</option>
                  ))}
                </select>

                <button 
                  onClick={() => runAiAudit(selectedRepoName)} 
                  className="btn-primary" 
                  disabled={auditLoading || !selectedRepoName}
                  style={styles.runAuditBtn}
                >
                  {auditLoading ? <Loader2 className="spinner" size={16} /> : <Sparkles size={16} />}
                  <span>Generate Audit</span>
                </button>
              </div>
            </div>

            {auditLoading && (
              <div style={styles.loaderBox}>
                <Loader2 className="spinner" size={40} />
                <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>AI is scanning repository files and metadata...</p>
              </div>
            )}

            {!auditLoading && auditReport && (
              <div style={styles.reportContainer}>
                {/* Score Widget Card */}
                <div style={styles.scoreRow}>
                  <div style={styles.scoreGaugeCard} className="glass-card">
                    <div style={styles.scoreValueContainer}>
                      <span style={{ 
                        ...styles.scoreNumber,
                        color: auditReport.score >= 80 ? '#10b981' : auditReport.score >= 50 ? '#f59e0b' : '#ef4444'
                      }}>{auditReport.score}</span>
                      <span style={styles.scoreDenominator}>/ 100</span>
                    </div>
                    <span style={styles.scoreLabel}>Health Score</span>
                  </div>

                  <div style={styles.repoOverviewCard} className="glass-card">
                    <div style={styles.overviewHeader}>
                      <h3 style={styles.overviewTitle}>{auditReport.repoName}</h3>
                      <span style={styles.reportTimestamp}>Audit executed at {auditReport.updatedAt}</span>
                    </div>
                    <p style={styles.overviewDesc}>{auditReport.description}</p>
                    <div style={styles.overviewStatsRow}>
                      <div style={styles.overviewStat}>
                        <span style={styles.statVal}>{repos.find(r => r.name === auditReport.repoName)?.open_issues_count || 0}</span>
                        <span style={styles.statLbl}>Open Issues</span>
                      </div>
                      <div style={styles.overviewStat}>
                        <span style={styles.statVal}>{repos.find(r => r.name === auditReport.repoName)?.stargazers_count || 0}</span>
                        <span style={styles.statLbl}>Stars</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-tab segment selection */}
                <div style={styles.subTabNav} className="glass-card">
                  <button 
                    style={{
                      ...styles.subTabBtn,
                      ...(auditorSubTab === 'overview' ? styles.subTabBtnActive : {})
                    }}
                    onClick={() => setAuditorSubTab('overview')}
                  >
                    <Info size={14} />
                    <span>Overview & Findings</span>
                  </button>
                  <button 
                    style={{
                      ...styles.subTabBtn,
                      ...(auditorSubTab === 'commits' ? styles.subTabBtnActive : {})
                    }}
                    onClick={() => setAuditorSubTab('commits')}
                  >
                    <Clock size={14} />
                    <span>Commit History ({auditReport.commits?.length || 0})</span>
                  </button>
                  <button 
                    style={{
                      ...styles.subTabBtn,
                      ...(auditorSubTab === 'branches' ? styles.subTabBtnActive : {})
                    }}
                    onClick={() => setAuditorSubTab('branches')}
                  >
                    <GitBranch size={14} />
                    <span>Branch Protection ({auditReport.branches?.length || 0})</span>
                  </button>
                </div>

                {/* Sub-tab 1: Findings List */}
                {auditorSubTab === 'overview' && (
                  <div>
                    <h3 style={styles.sectionHeaderTitle}>Audit Findings & Recommendations</h3>
                    <div style={styles.findingsList}>
                      {auditReport.findings.map((finding, idx) => (
                        <div 
                          key={idx} 
                          style={{
                            ...styles.findingCard,
                            borderLeft: `4px solid ${
                              finding.type === 'danger' ? '#ef4444' : 
                              finding.type === 'warning' ? '#f59e0b' : 
                              finding.type === 'success' ? '#10b981' : '#3b82f6'
                            }`
                          }}
                          className="glass-card"
                        >
                          <div style={styles.findingHeader}>
                            <div style={styles.findingTitleRow}>
                              {finding.type === 'danger' && <AlertTriangle size={16} style={{ color: '#ef4444' }} />}
                              {finding.type === 'warning' && <AlertTriangle size={16} style={{ color: '#f59e0b' }} />}
                              {finding.type === 'success' && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
                              {finding.type === 'info' && <Info size={16} style={{ color: '#3b82f6' }} />}
                              <span style={styles.findingCategory}>{finding.category}</span>
                            </div>
                            <span style={{
                              ...styles.findingBadge,
                              color: 
                                finding.type === 'danger' ? '#ef4444' : 
                                finding.type === 'warning' ? '#f59e0b' : 
                                finding.type === 'success' ? '#10b981' : '#3b82f6',
                              backgroundColor:
                                finding.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 
                                finding.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                                finding.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                            }}>{finding.type.toUpperCase()}</span>
                          </div>
                          <p style={styles.findingMessage}>{finding.message}</p>
                          
                          <div style={styles.findingFixBox}>
                            <span style={styles.fixLabel}>Suggested Action:</span>
                            <p style={styles.fixText}>{finding.fix}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Commit History Audit */}
                {auditorSubTab === 'commits' && (
                  <div style={styles.commitsContainer} className="glass-card">
                    <div style={styles.subTabHeader}>
                      <div>
                        <h3 style={styles.chartTitle}>Recent Commits Governance Scan</h3>
                        <p style={styles.chartSubtitle}>Auditing Conventional Commit compliance and syntax quality.</p>
                      </div>
                      <div style={styles.metricsBadgeContainer}>
                        <span style={styles.complianceRatingBadge}>
                          Compliance Rate: <strong>{auditReport.compliancePercentage}%</strong>
                        </span>
                      </div>
                    </div>

                    {!auditReport.commits || auditReport.commits.length === 0 ? (
                      <div style={styles.emptyState}>
                        <Info size={32} />
                        <p>No recent commits found for this repository.</p>
                      </div>
                    ) : (
                      <div style={styles.commitsList}>
                        {auditReport.commits.map((c, idx) => {
                          const commitInfo = c.commit;
                          const authorInfo = c.author || {
                            avatar_url: 'https://github.com/identicons/git.png',
                            login: commitInfo?.author?.name || 'unknown'
                          };
                          const commitAnalysis = analyzeCommitMsg(commitInfo?.message || '');
                          const dateStr = commitInfo?.author?.date 
                            ? new Date(commitInfo.author.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Unknown date';

                          return (
                            <div key={idx} style={styles.commitItem} className="hover-lift">
                              <div style={styles.commitAuthorCol}>
                                <img 
                                  src={authorInfo.avatar_url} 
                                  alt={authorInfo.login} 
                                  style={styles.commitAvatar} 
                                />
                                <span style={styles.commitAuthorName}>@{authorInfo.login}</span>
                              </div>

                              <div style={styles.commitMessageCol}>
                                <span style={styles.commitMessageText}>{commitInfo?.message?.split('\n')[0]}</span>
                                <div style={styles.commitMetaRow}>
                                  <span style={styles.commitDateText}>{dateStr}</span>
                                  <span style={styles.commitHash}>sha: {c.sha?.substring(0, 7)}</span>
                                </div>
                              </div>

                              <div style={styles.commitAuditBadgesCol}>
                                <span style={{
                                  ...styles.badgeStyle,
                                  color: commitAnalysis.isConventional ? '#10b981' : '#f59e0b',
                                  backgroundColor: commitAnalysis.isConventional ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                                }}>
                                  {commitAnalysis.isConventional ? 'Conventional' : 'Non-Standard'}
                                </span>

                                <span style={{
                                  ...styles.badgeStyle,
                                  color: commitAnalysis.quality === 'Standard' ? '#10b981' : commitAnalysis.quality === 'Too Short' ? '#ef4444' : '#3b82f6',
                                  backgroundColor: commitAnalysis.quality === 'Standard' ? 'rgba(16, 185, 129, 0.1)' : commitAnalysis.quality === 'Too Short' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                                }}>
                                  {commitAnalysis.quality}
                                </span>

                                <span style={styles.classificationBadge}>
                                  {commitAnalysis.classification}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Branches Security Check */}
                {auditorSubTab === 'branches' && (
                  <div style={styles.branchesContainer} className="glass-card">
                    <div style={styles.subTabHeader}>
                      <div>
                        <h3 style={styles.chartTitle}>Branch Governance & Safety</h3>
                        <p style={styles.chartSubtitle}>Detecting configuration risks, write policies, and stray dev environments.</p>
                      </div>
                    </div>

                    {!auditReport.branches || auditReport.branches.length === 0 ? (
                      <div style={styles.emptyState}>
                        <Info size={32} />
                        <p>No branches found for this repository.</p>
                      </div>
                    ) : (
                      <div style={styles.branchesGrid}>
                        {auditReport.branches.map((branch, idx) => {
                          const isDefault = branch.name === (repos.find(r => r.name === auditReport.repoName)?.default_branch || 'main');
                          return (
                            <div key={idx} style={styles.branchCard} className="glass-card">
                              <div style={styles.branchHeader}>
                                <div style={styles.branchTitleGroup}>
                                  <GitBranch size={16} style={{ color: isDefault ? 'var(--primary)' : 'var(--text-secondary)' }} />
                                  <span style={styles.branchNameText}>{branch.name}</span>
                                </div>
                                {isDefault && <span style={styles.defaultBranchBadge}>DEFAULT</span>}
                              </div>

                              <div style={styles.branchDetails}>
                                <div style={styles.branchMetaRow}>
                                  <span style={styles.metaLabelText}>Protection Rule:</span>
                                  {branch.protected ? (
                                    <span style={styles.protectedLabel}>
                                      <Lock size={12} />
                                      Protected
                                    </span>
                                  ) : (
                                    <span style={styles.unprotectedLabel}>
                                      <Unlock size={12} />
                                      Unprotected
                                    </span>
                                  )}
                                </div>

                                <div style={styles.branchRecommendationBox}>
                                  {branch.protected ? (
                                    <p style={{ color: '#10b981', margin: 0 }}>
                                      ✓ Direct force pushes blocked. Enforces merge reviews.
                                    </p>
                                  ) : isDefault ? (
                                    <p style={{ color: '#f87171', margin: 0 }}>
                                      ⚠ CRITICAL: The default branch can be rewritten or force-pushed. Please protect this branch.
                                    </p>
                                  ) : (
                                    <p style={{ color: '#9ca3af', margin: 0 }}>
                                      Temporary branch. Ensure branch cleanup is performed post pull-request merge.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === 'analytics' && (
          <div style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2 style={styles.pageTitle}>Analytics Insights</h2>
                <p style={styles.pageSubtitle}>Aggregate portfolio intelligence and code breakdowns.</p>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard} className="glass-card">
                <span style={styles.metricLabel}>Total Repositories</span>
                <span style={styles.metricValue}>{repos.length}</span>
                <div style={styles.metricDetails}>
                  <span>{stats.publicCount} Public</span>
                  <span style={styles.separatorDot} />
                  <span>{stats.privateCount} Private</span>
                </div>
              </div>

              <div style={styles.metricCard} className="glass-card">
                <span style={styles.metricLabel}>Total Stars Accumulated</span>
                <span style={styles.metricValue}>{stats.stars}</span>
                <div style={styles.metricDetails}>
                  <Star size={12} style={{ color: '#f59e0b', marginRight: 4 }} />
                  <span>Across all projects</span>
                </div>
              </div>

              <div style={styles.metricCard} className="glass-card">
                <span style={styles.metricLabel}>Total Forks</span>
                <span style={styles.metricValue}>{stats.forks}</span>
                <div style={styles.metricDetails}>
                  <GitFork size={12} style={{ color: '#06b6d4', marginRight: 4 }} />
                  <span>Developer integrations</span>
                </div>
              </div>
            </div>

            {/* Language Breakdown */}
            <div style={styles.analyticsLayoutRow}>
              <div style={styles.languageSectionCard} className="glass-card">
                <h3 style={styles.chartTitle}>Language Distribution</h3>
                <p style={styles.chartSubtitle}>Frequency counts of primary programming languages.</p>
                
                {Object.keys(stats.languages).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', marginTop: 20 }}>No languages data available.</p>
                ) : (
                  <div style={styles.languagesList}>
                    {Object.entries(stats.languages).map(([lang, count]) => {
                      const total = repos.length || 1;
                      const percentage = Math.round((count / total) * 100);
                      const color = getLanguageColor(lang);
                      return (
                        <div key={lang} style={styles.languageRow}>
                          <div style={styles.langLabelRow}>
                            <span style={styles.langName}>
                              <span style={{ ...styles.languageDot, backgroundColor: color }} />
                              {lang}
                            </span>
                            <span style={styles.langPercentage}>{count} repos ({percentage}%)</span>
                          </div>
                          <div style={styles.progressBarBg}>
                            <div style={{ 
                              ...styles.progressBarFill, 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Maintenance summary card */}
              <div style={styles.maintenanceCard} className="glass-card">
                <h3 style={styles.chartTitle}>AI Portfolio Assessment</h3>
                <p style={styles.chartSubtitle}>Overall system health indicators.</p>
                <div style={styles.assessmentList}>
                  <div style={styles.assessmentItem}>
                    <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div>
                      <h4 style={styles.assessmentItemTitle}>Authentication Status</h4>
                      <p style={styles.assessmentItemDesc}>Active authorization via {authMethod.toUpperCase()}. Secure server-side sessions.</p>
                    </div>
                  </div>

                  <div style={styles.assessmentItem}>
                    <BookOpen size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                    <div>
                      <h4 style={styles.assessmentItemTitle}>Documentation Coverage</h4>
                      <p style={styles.assessmentItemDesc}>Use the AI Auditor tab to run automatic checklists on missing setup documentations.</p>
                    </div>
                  </div>

                  <div style={styles.assessmentItem}>
                    <Info size={18} style={{ color: '#06b6d4', flexShrink: 0 }} />
                    <div>
                      <h4 style={styles.assessmentItemTitle}>Rate Limits Status</h4>
                      <p style={styles.assessmentItemDesc}>Standard GitHub API usage tokens are cached when checking dashboard stats.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helpers
function getLanguageColor(language) {
  if (!language) return '#6b7280';
  const colors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    Ruby: '#701516',
    Shell: '#89e051',
    PHP: '#4F5D95'
  };
  return colors[language] || '#a78bfa';
}

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#07070a',
    position: 'relative',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
    borderRight: '1px solid var(--border-color)',
    borderRadius: '0 20px 20px 0',
    backgroundColor: 'rgba(9, 9, 14, 0.75)',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  userProfile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  avatarWrapper: {
    position: 'relative',
    width: '80px',
    height: '80px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    border: '2px solid rgba(139, 92, 246, 0.25)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
  },
  badge: {
    position: 'absolute',
    bottom: '-4px',
    right: '-4px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid #09090e',
    boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userName: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  userLogin: {
    fontSize: '13px',
    color: '#8b5cf6',
    fontWeight: '500',
  },
  userBio: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '6px',
    lineHeight: '1.4',
  },
  userFollows: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    marginBottom: '20px',
  },
  followItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#9ca3af',
  },
  menuDivider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    margin: '0 -20px 20px -20px',
  },
  navigation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    color: '#9ca3af',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    transition: 'color var(--transition-fast), background var(--transition-fast)',
  },
  navItemActive: {
    color: '#ffffff',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
  },
  sidebarFooter: {
    marginTop: 'auto',
  },
  logoutBtn: {
    width: '100%',
    justifyContent: 'center',
    height: '42px',
    fontSize: '14px',
    gap: '8px',
  },
  mainContent: {
    flexGrow: 1,
    padding: '40px',
    overflowY: 'auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    padding: '14px 20px',
    borderRadius: '12px',
    fontSize: '14px',
  },
  retryBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  refreshBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-color)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background var(--transition-fast)',
  },
  searchBarContainer: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flexGrow: 1,
    minWidth: '260px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
  },
  searchInput: {
    paddingLeft: '44px',
    height: '44px',
  },
  filtersWrapper: {
    display: 'flex',
    gap: '12px',
  },
  filterSelect: {
    height: '44px',
    width: '180px',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px top 50%',
    paddingRight: '36px',
  },
  loaderBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px 20px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '60px 20px',
    textAlign: 'center',
    color: '#9ca3af',
  },
  repoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  repoCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minHeight: '180px',
  },
  repoCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  repoName: {
    fontSize: '17px',
    fontWeight: '700',
    margin: 0,
    lineBreak: 'anywhere',
  },
  repoLink: {
    color: '#fff',
    transition: 'color var(--transition-fast)',
  },
  repoLinkHover: {
    color: '#8b5cf6',
  },
  badgePublic: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '20px',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '#22d3ee',
    fontWeight: '600',
    border: '1px solid rgba(6, 182, 212, 0.15)',
  },
  badgePrivate: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '20px',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    color: '#f472b6',
    fontWeight: '600',
    border: '1px solid rgba(236, 72, 153, 0.15)',
  },
  repoDescription: {
    fontSize: '13px',
    color: '#9ca3af',
    lineHeight: '1.5',
    flexGrow: 1,
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  repoCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '12px',
    marginTop: '4px',
  },
  repoMetaLeft: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#9ca3af',
    alignItems: 'center',
  },
  repoLanguage: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  languageDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  metaIcon: {
    color: '#6b7280',
  },
  auditActionBtn: {
    background: 'rgba(139, 92, 246, 0.06)',
    border: '1px solid rgba(139, 92, 246, 0.12)',
    padding: '6px 12px',
    borderRadius: '8px',
    color: '#a78bfa',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background var(--transition-fast), border var(--transition-fast)',
  },
  auditorSetup: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  selectLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#9ca3af',
  },
  auditorSelectorRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  repoSelectInput: {
    flexGrow: 1,
    minWidth: '220px',
    height: '46px',
    cursor: 'pointer',
  },
  runAuditBtn: {
    height: '46px',
    padding: '0 24px',
  },
  reportContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  scoreRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  scoreGaugeCard: {
    width: '160px',
    height: '160px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  scoreValueContainer: {
    display: 'flex',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: '48px',
    fontWeight: '800',
  },
  scoreDenominator: {
    fontSize: '14px',
    color: '#6b7280',
    marginLeft: '2px',
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  repoOverviewCard: {
    flexGrow: 1,
    minWidth: '280px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  overviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '8px',
  },
  overviewTitle: {
    fontSize: '22px',
    fontWeight: '800',
  },
  reportTimestamp: {
    fontSize: '12px',
    color: '#6b7280',
  },
  overviewDesc: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  overviewStatsRow: {
    display: 'flex',
    gap: '24px',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  overviewStat: {
    display: 'flex',
    flexDirection: 'column',
  },
  statVal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  statLbl: {
    fontSize: '11px',
    color: '#6b7280',
  },
  sectionHeaderTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    marginTop: '12px',
  },
  findingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  findingCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  findingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  findingTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  findingCategory: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
  },
  findingBadge: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '12px',
    letterSpacing: '0.03em',
  },
  findingMessage: {
    fontSize: '13px',
    color: '#d1d5db',
    lineHeight: '1.5',
  },
  findingFixBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '4px',
  },
  fixLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#a78bfa',
    display: 'block',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  fixText: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.4',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  metricCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  metricValue: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#fff',
  },
  metricDetails: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  separatorDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#374151',
    margin: '0 8px',
  },
  analyticsLayoutRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  languageSectionCard: {
    flex: '2 1 400px',
    padding: '24px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  chartSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '2px',
  },
  languagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '20px',
  },
  languageRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  langLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  langName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  langPercentage: {
    color: '#9ca3af',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  maintenanceCard: {
    flex: '1 1 280px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  assessmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '20px',
  },
  assessmentItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  assessmentItemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
  },
  assessmentItemDesc: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
    lineHeight: '1.4',
  },
  subTabNav: {
    display: 'flex',
    gap: '12px',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  subTabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  subTabBtnActive: {
    color: '#ffffff',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)',
  },
  subTabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  metricsBadgeContainer: {
    display: 'flex',
    gap: '8px',
  },
  complianceRatingBadge: {
    fontSize: '13px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '#22d3ee',
    border: '1px solid rgba(6, 182, 212, 0.15)',
    fontWeight: '500',
  },
  commitsContainer: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  commitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  commitItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  commitAuthorCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '180px',
    flexShrink: 0,
  },
  commitAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  commitAuthorName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#d1d5db',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  commitMessageCol: {
    flexGrow: 1,
    minWidth: '240px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  commitMessageText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    lineHeight: '1.4',
  },
  commitMetaRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#6b7280',
  },
  commitDateText: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  commitHash: {
    fontFamily: 'var(--font-mono)',
  },
  commitAuditBadgesCol: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    width: '280px',
    flexShrink: 0,
  },
  badgeStyle: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  classificationBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
    color: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    border: '1px solid rgba(167, 139, 250, 0.15)',
  },
  branchesContainer: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  branchesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  branchCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  branchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  branchTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
  },
  branchNameText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  defaultBranchBadge: {
    fontSize: '9px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    color: '#c084fc',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  },
  branchDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  branchMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  metaLabelText: {
    color: '#6b7280',
  },
  protectedLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#10b981',
    fontWeight: '600',
  },
  unprotectedLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#f87171',
    fontWeight: '600',
  },
  branchRecommendationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '6px',
    padding: '8px',
    fontSize: '11px',
    lineHeight: '1.4',
  }
};

function analyzeCommitMsg(message) {
  if (!message) return { classification: 'General Update', quality: 'Standard', isConventional: false };
  const msg = message.toLowerCase();
  let classification = 'General Update';
  let quality = 'Standard';
  let isConventional = false;

  const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore|build|ci|perf)(\(.+\))?!?:.+$|^(Initial commit|Merge branch)/i;
  
  if (conventionalRegex.test(message)) {
    isConventional = true;
    if (msg.startsWith('feat')) classification = 'Feature Addition';
    else if (msg.startsWith('fix')) classification = 'Bug Fix Patch';
    else if (msg.startsWith('docs')) classification = 'Documentation';
    else if (msg.startsWith('style')) classification = 'Code Styling';
    else if (msg.startsWith('refactor')) classification = 'Refactoring';
    else if (msg.startsWith('test')) classification = 'Testing Suite';
    else if (msg.startsWith('chore')) classification = 'Maintenance Task';
    else if (msg.startsWith('build') || msg.startsWith('ci')) classification = 'CI/CD Build';
    else if (msg.startsWith('perf')) classification = 'Performance Tuning';
  } else {
    if (msg.includes('fix') || msg.includes('bug')) classification = 'Patch Fix';
    else if (msg.includes('add') || msg.includes('create')) classification = 'Code Addition';
    else if (msg.includes('update') || msg.includes('modify')) classification = 'Modification';
    else if (msg.includes('remove') || msg.includes('delete')) classification = 'Cleanup';
    else if (msg.includes('refactor')) classification = 'Refactoring';
    else if (msg.includes('doc') || msg.includes('readme')) classification = 'Documentation';
  }

  if (message.trim().length < 10) {
    quality = 'Too Short';
  } else if (message.trim().length > 72) {
    quality = 'Verbose';
  }

  return { classification, quality, isConventional };
}
