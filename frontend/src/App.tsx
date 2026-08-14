import { useState, useEffect, useCallback } from 'react'
import { api, Pipeline, PipelineStats, FailureAnalysis, Notification } from './api'
import { 
  LayoutDashboard, GitBranch, Bot, History, Bell, Bug, CheckCircle, 
  Package, TrendingUp, Timer, Rocket, XCircle, Hourglass, RefreshCw, 
  FileText, Terminal, Copy, Check, Search, ArrowUpRight, Activity, 
  Sparkles, Cpu, Layers, AlertTriangle, ShieldCheck, ChevronRight,
  Code2
} from 'lucide-react'

// ==================== GitHub Icon Component ====================
function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

// ==================== App Main Component ====================
export default function App() {
  const [page, setPage] = useState<string>('dashboard')
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'info' | 'success' | 'danger' } | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const refreshUnread = useCallback(async () => {
    try {
      const data = await api.getUnreadCount()
      setUnreadCount(data.count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, 4000)
    return () => clearInterval(interval)
  }, [refreshUnread])

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'danger' = 'info') => {
    setToast({ title, message, type })
    setTimeout(() => setToast(null), 4500)
  }

  const navigateToPipeline = (id: string) => {
    setSelectedPipelineId(id)
    setPage('pipeline-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToAnalysis = (pipelineId: string) => {
    setSelectedFailureId(pipelineId)
    setPage('analysis-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSimulate = async (injectBug: boolean) => {
    setIsSimulating(true)
    try {
      await api.simulatePush(injectBug)
      refreshUnread()
      showToast(
        injectBug ? 'Pipeline Failure Injected' : 'Clean Push Dispatched',
        injectBug ? 'Simulated null pointer bug in PaymentService. AI Analyzer triggered.' : 'Simulated valid commit. Build should succeed with 100% tests.',
        injectBug ? 'danger' : 'success'
      )
    } catch {
      showToast('Simulation Error', 'Failed to dispatch webhook event.', 'danger')
    } finally {
      setIsSimulating(false)
    }
  }

  const pageNames: Record<string, string> = {
    dashboard: 'Dashboard',
    pipelines: 'Pipeline Registry',
    'pipeline-detail': 'Pipeline Execution Details',
    failures: 'AI Neural Triage Feed',
    'analysis-detail': 'AI Root Cause Analysis HUD',
    history: 'Execution History',
    notifications: 'Notification Center'
  }

  return (
    <div className="app-layout">
      {/* Machined Floating Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-badge">
            <Cpu size={20} />
          </div>
          <div className="sidebar-brand">
            <h1>CICD-AI <span className="version-chip">v2.4</span></h1>
            <span className="tagline">Failure Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Core Platform</div>
          <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setPage('dashboard')}>
            <span className="nav-icon"><LayoutDashboard size={18} /></span>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${page === 'pipelines' || page === 'pipeline-detail' ? 'active' : ''}`}
                  onClick={() => setPage('pipelines')}>
            <span className="nav-icon"><GitBranch size={18} /></span>
            <span>Pipelines</span>
          </button>
          <button className={`nav-item ${page === 'failures' || page === 'analysis-detail' ? 'active' : ''}`}
                  onClick={() => setPage('failures')}>
            <span className="nav-icon"><Bot size={18} /></span>
            <span>AI Neural Analysis</span>
          </button>
          <button className={`nav-item ${page === 'history' ? 'active' : ''}`}
                  onClick={() => setPage('history')}>
            <span className="nav-icon"><History size={18} /></span>
            <span>Run History</span>
          </button>
          <button className={`nav-item ${page === 'notifications' ? 'active' : ''}`}
                  onClick={() => setPage('notifications')}>
            <span className="nav-icon"><Bell size={18} /></span>
            <span>Alerts</span>
            {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
          </button>
        </nav>

        {/* Sidebar Telemetry, Bright GitHub Link & Quick Simulation Triggers */}
        <div className="sidebar-footer">
          {/* Prominent GitHub Button in Sidebar */}
          <a 
            href="https://github.com/Bhaumik-99/cicd-ai" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-github"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <GitHubIcon size={16} />
            <span>GitHub Repo</span>
            <span className="github-arrow">↗</span>
          </a>

          <div className="telemetry-card">
            <div className="telemetry-row">
              <span style={{ color: 'var(--text-muted)' }}>AI Analyzer</span>
              <span className="telemetry-status">
                <span className="pulse-dot" /> Online
              </span>
            </div>
            <div className="telemetry-row" style={{ marginTop: 6 }}>
              <span style={{ color: 'var(--text-dim)' }}>Engine</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)' }}>GPT-4o / Claude</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button 
              className="btn btn-danger" 
              style={{ width: '100%', fontSize: 13 }}
              disabled={isSimulating}
              onClick={() => handleSimulate(true)}
            >
              <Bug size={15} /> Simulate Bug Push
            </button>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ width: '100%', fontSize: 12 }}
              disabled={isSimulating}
              onClick={() => handleSimulate(false)}
            >
              <ShieldCheck size={14} style={{ color: 'var(--accent-green)' }} /> Clean Build
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Global Navigation Bar with Bright GitHub Link */}
        <header className="top-nav-bar">
          <div className="top-nav-breadcrumbs">
            <Cpu size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>CICD-AI Platform</span>
            <span>/</span>
            <span className="crumb-active">{pageNames[page] || 'Dashboard'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-green)' }}>
              <span className="pulse-dot" />
              <span style={{ fontWeight: 600 }}>System Healthy</span>
            </div>

            {/* Bright Visible GitHub Button */}
            <a 
              href="https://github.com/Bhaumik-99/cicd-ai" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-github"
              title="Open GitHub Repository in a new tab"
            >
              <GitHubIcon size={17} />
              <span>GitHub Repository</span>
              <span className="github-arrow">↗</span>
            </a>
          </div>
        </header>

        {page === 'dashboard' && <DashboardPage onNavigatePipeline={navigateToPipeline} onNavigateAnalysis={navigateToAnalysis} />}
        {page === 'pipelines' && <PipelinesPage onNavigate={navigateToPipeline} onNavigateAnalysis={navigateToAnalysis} />}
        {page === 'pipeline-detail' && selectedPipelineId &&
          <PipelineDetailPage id={selectedPipelineId} onBack={() => setPage('pipelines')} onViewAnalysis={navigateToAnalysis} />}
        {page === 'failures' && <FailuresPage onNavigate={navigateToAnalysis} />}
        {page === 'analysis-detail' && selectedFailureId &&
          <AnalysisDetailPage pipelineId={selectedFailureId} onBack={() => setPage('failures')} />}
        {page === 'history' && <FailuresPage onNavigate={navigateToAnalysis} />}
        {page === 'notifications' && <NotificationsPage onRefreshCount={refreshUnread} />}
      </main>

      {/* Floating Haptic Toast */}
      {toast && (
        <div className="toast">
          <div className="toast-title">
            {toast.type === 'danger' && <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />}
            {toast.type === 'success' && <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />}
            {toast.type === 'info' && <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />}
            {toast.title}
          </div>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </div>
  )
}

// ==================== Dashboard Page ====================
function DashboardPage({ 
  onNavigatePipeline, 
  onNavigateAnalysis 
}: { 
  onNavigatePipeline: (id: string) => void;
  onNavigateAnalysis: (id: string) => void;
}) {
  const [stats, setStats] = useState<PipelineStats | null>(null)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.getPipelineStats(), api.getPipelines()])
      setStats(s)
      setPipelines(p.slice(0, 10))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    const i = setInterval(refresh, 3500)
    return () => clearInterval(i)
  }, [refresh])

  if (loading && !stats) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Telemetry</h1>
          <p className="page-subtitle">Real-time pipeline diagnostics, autonomous AI root-cause analysis & metrics.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={refresh}>
            <RefreshCw size={14} /> Live Sync
          </button>
        </div>
      </div>

      {/* Interactive Microservice Pipeline Flow (DAG) */}
      <div className="dag-container">
        <div className="dag-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)' }}>
              Live Microservice Topology Flow
            </span>
          </div>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
            ● EVENT_DRIVEN_KAFKA_BUS
          </span>
        </div>

        <div className="dag-steps">
          <div className="dag-node active">
            <div className="dag-circle"><GitBranch size={18} /></div>
            <span className="dag-label">Git Push</span>
            <span className="dag-port">GitHub / GitLab</span>
          </div>
          <div className="dag-connector active" />

          <div className="dag-node active">
            <div className="dag-circle"><Rocket size={18} /></div>
            <span className="dag-label">Webhook</span>
            <span className="dag-port">Port :8081</span>
          </div>
          <div className="dag-connector active" />

          <div className="dag-node active">
            <div className="dag-circle"><Layers size={18} /></div>
            <span className="dag-label">Build Worker</span>
            <span className="dag-port">Port :8083</span>
          </div>
          <div className="dag-connector active" />

          <div className={`dag-node ${(stats?.failed ?? 0) > 0 ? 'failed' : 'success'}`}>
            <div className="dag-circle"><Code2 size={18} /></div>
            <span className="dag-label">Maven Tests</span>
            <span className="dag-port">JUnit / Surefire</span>
          </div>
          <div className="dag-connector active" />

          <div className="dag-node active">
            <div className="dag-circle"><Bot size={18} /></div>
            <span className="dag-label">AI Analyzer</span>
            <span className="dag-port">Port :8084</span>
          </div>
          <div className="dag-connector active" />

          <div className="dag-node success">
            <div className="dag-circle"><Bell size={18} /></div>
            <span className="dag-label">Notifier</span>
            <span className="dag-port">Port :8085</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <span className="stat-label">Total Executions</span>
            <div className="stat-icon"><Package size={18} /></div>
          </div>
          <div className="stat-value">{stats?.total ?? 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Across all branches</div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <span className="stat-label">Successful Builds</span>
            <div className="stat-icon"><CheckCircle size={18} /></div>
          </div>
          <div className="stat-value">{stats?.successful ?? 0}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 4 }}>Passing all checks</div>
        </div>

        <div className="stat-card red">
          <div className="stat-header">
            <span className="stat-label">Failed Runs</span>
            <div className="stat-icon"><XCircle size={18} /></div>
          </div>
          <div className="stat-value">{stats?.failed ?? 0}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>Triggered AI triage</div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-header">
            <span className="stat-label">Failure Rate</span>
            <div className="stat-icon"><TrendingUp size={18} /></div>
          </div>
          <div className="stat-value">{stats?.failureRate ?? 0}%</div>
          <div style={{ fontSize: 11, color: 'var(--accent-yellow)', marginTop: 4 }}>Current interval</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <span className="stat-label">Avg Execution</span>
            <div className="stat-icon"><Timer size={18} /></div>
          </div>
          <div className="stat-value">
            {stats?.averageBuildTimeMs ? `${(stats.averageBuildTimeMs / 1000).toFixed(1)}s` : '3.2s'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--accent-purple)', marginTop: 4 }}>End-to-end latency</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <span className="stat-label">AI Diagnosed</span>
            <div className="stat-icon"><Bot size={18} /></div>
          </div>
          <div className="stat-value">{stats?.resolved ?? 0}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 4 }}>Root causes found</div>
        </div>
      </div>

      {/* Recent Pipelines Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitBranch size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Recent Pipeline Executions</h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-refreshing live data</span>
        </div>

        {pipelines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Rocket size={44} /></div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No Pipelines In Queue</p>
            <p style={{ fontSize: 13 }}>Click "Simulate Bug Push" on the left panel to trigger an autonomous demo flow.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Branch</th>
                <th>Commit</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map(p => (
                <tr key={p.id} className="clickable-row" onClick={() => onNavigatePipeline(p.id)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{p.repository}</span>
                    </div>
                  </td>
                  <td>
                    <span className="branch-badge">
                      <GitBranch size={12} /> {p.branch}
                    </span>
                  </td>
                  <td>
                    <span className="commit-chip">{p.commitSha?.substring(0, 7)}</span>
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : 'Running...'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{formatTime(p.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {(p.status === 'FAILED' || p.status === 'RESOLVED' || p.status === 'ANALYZING') ? (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigateAnalysis(p.id)
                        }}
                      >
                        <Bot size={13} /> AI Diagnosis
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                        <ChevronRight size={16} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ==================== Pipelines Page ====================
function PipelinesPage({ 
  onNavigate, 
  onNavigateAnalysis 
}: { 
  onNavigate: (id: string) => void;
  onNavigateAnalysis: (id: string) => void;
}) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    try { 
      setPipelines(await api.getPipelines()) 
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const i = setInterval(load, 3500)
    return () => clearInterval(i)
  }, [load])

  const filtered = pipelines.filter(p => {
    const matchesSearch = 
      p.repository.toLowerCase().includes(search.toLowerCase()) ||
      p.branch.toLowerCase().includes(search.toLowerCase()) ||
      p.commitSha.toLowerCase().includes(search.toLowerCase()) ||
      (p.author && p.author.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading && pipelines.length === 0) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline Registry</h1>
          <p className="page-subtitle">Complete registry of all CI/CD workflows, build logs, and test executions.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-box">
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search repo, branch, SHA..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="filter-select" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="RESOLVED">AI Resolved</option>
              <option value="RUNNING">Running</option>
              <option value="QUEUED">Queued</option>
            </select>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {pipelines.length} pipelines
          </span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Repository</th>
              <th>Branch</th>
              <th>Commit</th>
              <th>Author</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="clickable-row" onClick={() => onNavigate(p.id)}>
                <td style={{ fontWeight: 700, color: '#ffffff' }}>{p.repository}</td>
                <td>
                  <span className="branch-badge">
                    <GitBranch size={12} /> {p.branch}
                  </span>
                </td>
                <td><span className="commit-chip">{p.commitSha?.substring(0, 7)}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.author}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : '—'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{formatTime(p.createdAt)}</td>
                <td style={{ textAlign: 'right' }}>
                  {(p.status === 'FAILED' || p.status === 'RESOLVED') ? (
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--accent-cyan)' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigateAnalysis(p.id)
                      }}
                    >
                      <Bot size={13} /> AI Fix
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(p.id)}>
                      Details <ChevronRight size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== Pipeline Detail Page ====================
function PipelineDetailPage({ 
  id, 
  onBack, 
  onViewAnalysis 
}: { 
  id: string; 
  onBack: () => void; 
  onViewAnalysis: (id: string) => void;
}) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [logFilter, setLogFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      try { setPipeline(await api.getPipeline(id)) }
      catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const i = setInterval(load, 3000)
    return () => clearInterval(i)
  }, [id])

  const handleCopyLog = () => {
    if (!pipeline?.buildLog) return
    navigator.clipboard.writeText(pipeline.buildLog)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !pipeline) return <Loading />

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← Back to Registry
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{pipeline.repository}</h1>
          <p className="page-subtitle">
            Branch: <span style={{ color: '#ffffff' }}>{pipeline.branch}</span> • Commit: <code className="commit-chip">{pipeline.commitSha}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(pipeline.status === 'FAILED' || pipeline.status === 'ANALYZING' || pipeline.status === 'RESOLVED') && (
            <button className="btn btn-primary" onClick={() => onViewAnalysis(pipeline.id)}>
              <Bot size={16} /> View AI Root-Cause Analysis
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Stage Visualizer */}
      <div className="dag-container" style={{ marginBottom: 24 }}>
        <div className="dag-title-bar">
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Pipeline Execution Pipeline DAG
          </span>
          <StatusBadge status={pipeline.status} />
        </div>
        <div className="dag-steps">
          <div className="dag-node success">
            <div className="dag-circle"><GitBranch size={16} /></div>
            <span className="dag-label">Git Checkout</span>
            <span className="dag-port">Completed</span>
          </div>
          <div className="dag-connector active" />

          <div className="dag-node success">
            <div className="dag-circle"><Layers size={16} /></div>
            <span className="dag-label">Compile</span>
            <span className="dag-port">Java 21 / Maven</span>
          </div>
          <div className="dag-connector active" />

          <div className={`dag-node ${pipeline.status === 'FAILED' || pipeline.status === 'RESOLVED' ? 'failed' : 'success'}`}>
            <div className="dag-circle"><Code2 size={16} /></div>
            <span className="dag-label">Surefire Tests</span>
            <span className="dag-port">{pipeline.status === 'FAILED' || pipeline.status === 'RESOLVED' ? '1 Failure' : 'All Passed'}</span>
          </div>
          <div className="dag-connector active" />

          <div className={`dag-node ${pipeline.status === 'SUCCESS' ? 'success' : 'active'}`}>
            <div className="dag-circle"><Bot size={16} /></div>
            <span className="dag-label">AI Diagnostic</span>
            <span className="dag-port">{pipeline.status === 'FAILED' || pipeline.status === 'RESOLVED' ? 'Root Cause Analyzed' : 'Skipped (Clean)'}</span>
          </div>
        </div>
      </div>

      {/* Metadata Detail Grid */}
      <div className="detail-grid">
        <div className="detail-item">
          <div className="detail-label">Repository</div>
          <div className="detail-value">{pipeline.repository}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Branch</div>
          <div className="detail-value">{pipeline.branch}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Author</div>
          <div className="detail-value">{pipeline.author}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Duration</div>
          <div className="detail-value">{pipeline.durationMs ? `${(pipeline.durationMs / 1000).toFixed(1)}s` : 'In progress'}</div>
        </div>
      </div>

      {/* Test Results Banner */}
      {pipeline.testResults && (
        <div className="bezel-card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">
              <FileText size={15} style={{ color: 'var(--accent-cyan)' }} /> Test Execution Summary
            </div>
          </div>
          <div className="card-padding">
            <div className="code-block" style={{ color: pipeline.status === 'FAILED' || pipeline.status === 'RESOLVED' ? '#fb7185' : '#34d399' }}>
              {pipeline.testResults}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Build Log Viewer */}
      {pipeline.buildLog && (
        <div className="terminal-block">
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="terminal-controls">
                <span className="term-dot red" />
                <span className="term-dot yellow" />
                <span className="term-dot green" />
              </div>
              <span className="terminal-title">console.stdout — maven build output</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleCopyLog}>
                {copied ? <Check size={13} style={{ color: 'var(--accent-green)' }} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy Log'}
              </button>
            </div>
          </div>
          <div className="log-viewer">
            {pipeline.buildLog.split('\n').map((line, idx) => {
              const isErr = line.includes('[ERROR]') || line.includes('FAILURE') || line.includes('NullPointerException')
              const isInfo = line.includes('[INFO]')
              return (
                <div key={idx} className={isErr ? 'log-line-error' : isInfo ? 'log-line-info' : ''}>
                  <span style={{ color: 'var(--text-dim)', marginRight: 12, userSelect: 'none', fontSize: 11 }}>
                    {(idx + 1).toString().padStart(3, ' ')}
                  </span>
                  {line}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== Failures / AI Analysis Page ====================
function FailuresPage({ onNavigate }: { onNavigate: (pipelineId: string) => void }) {
  const [failures, setFailures] = useState<FailureAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      try { 
        setFailures(await api.getFailures(severityFilter ? { severity: severityFilter } : undefined)) 
      }
      catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const i = setInterval(load, 4000)
    return () => clearInterval(i)
  }, [severityFilter])

  if (loading && failures.length === 0) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Neural Triage Feed</h1>
          <p className="page-subtitle">Autonomous diagnosis of stack traces, build failures, and AST code diffs.</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select 
              className="filter-select" 
              value={severityFilter} 
              onChange={e => setSeverityFilter(e.target.value)}
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {failures.length} AI analyses generated
          </span>
        </div>

        {failures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bot size={44} /></div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No Build Failures Detected</p>
            <p style={{ fontSize: 13 }}>Trigger a bug simulation on the sidebar to test AI autonomous root-cause extraction.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Type</th>
                <th>Root Cause Diagnosis</th>
                <th>AI Confidence</th>
                <th>Severity</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {failures.map(f => (
                <tr key={f.id} className="clickable-row" onClick={() => onNavigate(f.pipelineId)}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{f.repository}</td>
                  <td><span className="badge badge-failed">{f.failureType}</span></td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {f.rootCause?.substring(0, 75)}...
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        fontWeight: 800, 
                        color: f.confidence > 0.8 ? 'var(--accent-green)' : 'var(--accent-yellow)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {(f.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{formatTime(f.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-cyan)' }}>
                      Inspect HUD <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ==================== Analysis Detail Page ====================
function AnalysisDetailPage({ 
  pipelineId, 
  onBack 
}: { 
  pipelineId: string; 
  onBack: () => void;
}) {
  const [analysis, setAnalysis] = useState<FailureAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedFix, setCopiedFix] = useState(false)

  useEffect(() => {
    const load = async () => {
      try { setAnalysis(await api.getFailureByPipeline(pipelineId)) }
      catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const i = setInterval(load, 3000)
    return () => clearInterval(i)
  }, [pipelineId])

  const handleCopyFix = () => {
    if (!analysis?.suggestedFix) return
    navigator.clipboard.writeText(analysis.suggestedFix)
    setCopiedFix(true)
    setTimeout(() => setCopiedFix(false), 2000)
  }

  if (loading) return <Loading />
  if (!analysis) return (
    <div>
      <button className="back-link" onClick={onBack}>← Back to Feed</button>
      <div className="empty-state">
        <div className="empty-state-icon"><Hourglass size={48} /></div>
        <p style={{ fontWeight: 600, color: '#ffffff' }}>AI Neural Analysis in Progress</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Analyzing Maven build logs, Surefire XML reports, and Git AST diff...</p>
      </div>
    </div>
  )

  const confidence = analysis.confidence
  const confidenceClass = confidence > 0.8 ? 'confidence-high' : confidence > 0.5 ? 'confidence-medium' : 'confidence-low'

  let affectedFiles: string[] = []
  try { affectedFiles = JSON.parse(analysis.affectedFiles) } catch { affectedFiles = [analysis.affectedFiles] }

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back to Failure Feed</button>

      <div className="analysis-panel">
        <div className="analysis-header">
          <div className="analysis-icon-box">
            <Bot size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff' }}>AI Root Cause Diagnosis</h2>
              <span className="badge badge-failed">{analysis.failureType}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
              Repository: <span style={{ color: '#ffffff', fontWeight: 600 }}>{analysis.repository}</span> • Commit: <code className="commit-chip">{analysis.commitSha?.substring(0, 7)}</code>
            </p>
          </div>
          <SeverityBadge severity={analysis.severity} />
        </div>

        {/* Confidence Widget */}
        <div className="confidence-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>
              Neural Diagnostic Confidence Score
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="confidence-bar-bg">
            <div className={`confidence-bar-fill ${confidenceClass}`} style={{ width: `${confidence * 100}%` }} />
          </div>
        </div>

        {/* Root Cause Card */}
        <div className="analysis-section">
          <div className="analysis-section-title">
            <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} /> Identified Root Cause
          </div>
          <div className="analysis-section-content" style={{ borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.04)' }}>
            <span style={{ fontWeight: 600, color: '#ffffff' }}>{analysis.rootCause}</span>
          </div>
        </div>

        {/* Affected Files */}
        <div className="analysis-section">
          <div className="analysis-section-title">
            <FileText size={14} /> Affected Files & Stack Pointers
          </div>
          <div className="affected-files">
            {affectedFiles.map((f, i) => (
              <span key={i} className="file-tag">
                <Code2 size={13} /> {f}
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="analysis-section">
          <div className="analysis-section-title">
            <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} /> Deep AST & Log Diagnostics
          </div>
          <div className="analysis-section-content" style={{ whiteSpace: 'pre-wrap' }}>
            {analysis.explanation}
          </div>
        </div>

        {/* Suggested AI Patch / Fix */}
        <div className="analysis-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="analysis-section-title" style={{ marginBottom: 0 }}>
              <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> Suggested Autonomous Code Patch
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleCopyFix}>
              {copiedFix ? <Check size={13} style={{ color: 'var(--accent-green)' }} /> : <Copy size={13} />}
              {copiedFix ? 'Copied Patch' : 'Copy Code Fix'}
            </button>
          </div>
          <div className="code-block" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: '#050912' }}>
            {analysis.suggestedFix}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Notifications Page ====================
function NotificationsPage({ onRefreshCount }: { onRefreshCount: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try { setNotifications(await api.getNotifications()) }
      catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleMarkAllRead = async () => {
    await api.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    onRefreshCount()
  }

  if (loading && notifications.length === 0) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification & Incident Alerts</h1>
          <p className="page-subtitle">Real-time alerts emitted by the Notification Microservice (:8085).</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
            <CheckCircle size={14} /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={44} /></div>
          <p style={{ fontWeight: 600, color: '#ffffff' }}>No Alerts in Inbox</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>All pipelines are healthy and executing normally.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`notification-item ${!n.read ? 'unread' : ''}`}
              onClick={async () => {
                if (!n.read) {
                  await api.markRead(n.id)
                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                  onRefreshCount()
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="notification-title">{n.title}</div>
                <SeverityBadge severity={n.severity || 'MEDIUM'} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, whiteSpace: 'pre-wrap' }}>
                {n.message}
              </div>
              <div className="notification-time">{formatTime(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Reusable Helpers & Badges ====================
function StatusBadge({ status }: { status: string }) {
  const normalized = status ? status.toUpperCase() : 'QUEUED'
  const icons: Record<string, React.ReactNode> = {
    QUEUED: <Hourglass size={12} />,
    RUNNING: <RefreshCw size={12} className="spin-icon" />,
    SUCCESS: <CheckCircle size={12} />,
    FAILED: <XCircle size={12} />,
    ANALYZING: <Bot size={12} />,
    RESOLVED: <CheckCircle size={12} />
  }

  let badgeClass = 'badge-queued'
  if (normalized === 'RUNNING') badgeClass = 'badge-running'
  else if (normalized === 'SUCCESS' || normalized === 'RESOLVED') badgeClass = 'badge-success'
  else if (normalized === 'FAILED') badgeClass = 'badge-failed'
  else if (normalized === 'ANALYZING') badgeClass = 'badge-analyzing'

  return (
    <span className={`badge ${badgeClass}`}>
      {icons[normalized] || null} {normalized}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const norm = severity ? severity.toUpperCase() : 'LOW'
  let cls = 'badge-low'
  if (norm === 'CRITICAL') cls = 'badge-critical'
  else if (norm === 'HIGH') cls = 'badge-high'
  else if (norm === 'MEDIUM') cls = 'badge-medium'

  return <span className={`badge ${cls}`}>{norm}</span>
}

function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Syncing AI telemetry stream...</span>
    </div>
  )
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  } catch { return iso }
}
