import { useState, useEffect, useCallback } from 'react'
import { api, Pipeline, PipelineStats, FailureAnalysis, Notification } from './api'
import { 
  LayoutDashboard, GitBranch, Bot, History, Bell, Bug, CheckCircle, 
  Package, TrendingUp, Timer, Rocket, XCircle, Hourglass, RefreshCw, FileText
} from 'lucide-react'

// ==================== App Component ====================
export default function App() {
  const [page, setPage] = useState<string>('dashboard')
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null)

  const refreshUnread = useCallback(async () => {
    try {
      const data = await api.getUnreadCount()
      setUnreadCount(data.count)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, 5000)
    return () => clearInterval(interval)
  }, [refreshUnread])

  const showToast = (title: string, message: string) => {
    setToast({ title, message })
    setTimeout(() => setToast(null), 5000)
  }

  const navigateToPipeline = (id: string) => {
    setSelectedPipelineId(id)
    setPage('pipeline-detail')
  }

  const navigateToAnalysis = (pipelineId: string) => {
    setSelectedFailureId(pipelineId)
    setPage('analysis-detail')
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>CICD-AI</h1>
          <span>Failure Intelligence</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setPage('dashboard')}>
            <span className="nav-icon"><LayoutDashboard size={20} /></span>
            <span>Dashboard</span>
          </button>
          <button className={`nav-item ${page === 'pipelines' || page === 'pipeline-detail' ? 'active' : ''}`}
                  onClick={() => setPage('pipelines')}>
            <span className="nav-icon"><GitBranch size={20} /></span>
            <span>Pipelines</span>
          </button>
          <button className={`nav-item ${page === 'failures' || page === 'analysis-detail' ? 'active' : ''}`}
                  onClick={() => setPage('failures')}>
            <span className="nav-icon"><Bot size={20} /></span>
            <span>AI Analysis</span>
          </button>
          <button className={`nav-item ${page === 'history' ? 'active' : ''}`}
                  onClick={() => setPage('history')}>
            <span className="nav-icon"><History size={20} /></span>
            <span>History</span>
          </button>
          <button className={`nav-item ${page === 'notifications' ? 'active' : ''}`}
                  onClick={() => setPage('notifications')}>
            <span className="nav-icon"><Bell size={20} /></span>
            <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
          </button>
        </nav>

        {/* Simulate Button in Sidebar */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn btn-danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={async () => {
                    try {
                      await api.simulatePush(true)
                      showToast('Webhook Sent', 'Simulated a push with a bug. Watch the pipeline flow!')
                    } catch { showToast('Error', 'Failed to simulate push') }
                  }}>
            <Bug size={16} style={{ marginRight: 8 }} /> Simulate Bug
          </button>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={async () => {
                    try {
                      await api.simulatePush(false)
                      showToast('Webhook Sent', 'Simulated a clean push. Build should succeed!')
                    } catch { showToast('Error', 'Failed to simulate push') }
                  }}>
            <CheckCircle size={16} style={{ marginRight: 8 }} /> Clean Push
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {page === 'dashboard' && <DashboardPage onNavigatePipeline={navigateToPipeline} />}
        {page === 'pipelines' && <PipelinesPage onNavigate={navigateToPipeline} />}
        {page === 'pipeline-detail' && selectedPipelineId &&
          <PipelineDetailPage id={selectedPipelineId} onBack={() => setPage('pipelines')}
                               onViewAnalysis={navigateToAnalysis} />}
        {page === 'failures' && <FailuresPage onNavigate={navigateToAnalysis} />}
        {page === 'analysis-detail' && selectedFailureId &&
          <AnalysisDetailPage pipelineId={selectedFailureId} onBack={() => setPage('failures')} />}
        {page === 'history' && <FailuresPage onNavigate={navigateToAnalysis} />}
        {page === 'notifications' && <NotificationsPage onRefreshCount={refreshUnread} />}
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </div>
  )
}

// ==================== Dashboard Page ====================
function DashboardPage({ onNavigatePipeline }: { onNavigatePipeline: (id: string) => void }) {
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
    const i = setInterval(refresh, 4000)
    return () => clearInterval(i)
  }, [refresh])

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">AI-Powered CI/CD Failure Intelligence</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><Package size={24} /></div>
          <div className="stat-value">{stats?.total ?? 0}</div>
          <div className="stat-label">Total Pipelines</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-value">{stats?.successful ?? 0}</div>
          <div className="stat-label">Successful</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><XCircle size={24} /></div>
          <div className="stat-value">{stats?.failed ?? 0}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-value">{stats?.failureRate ?? 0}%</div>
          <div className="stat-label">Failure Rate</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><Timer size={24} /></div>
          <div className="stat-value">{stats?.averageBuildTimeMs ? `${(stats.averageBuildTimeMs / 1000).toFixed(1)}s` : '—'}</div>
          <div className="stat-label">Avg Build Time</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><Bot size={24} /></div>
          <div className="stat-value">{stats?.resolved ?? 0}</div>
          <div className="stat-label">AI Resolved</div>
        </div>
      </div>

      {/* Recent Pipelines */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Recent Pipelines</h3>
        </div>
        {pipelines.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Rocket size={48} /></div>
            <p>No pipelines yet. Click "Simulate Bug" to trigger the demo flow!</p>
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
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map(p => (
                <tr key={p.id} className="clickable-row" onClick={() => onNavigatePipeline(p.id)}>
                  <td style={{ fontWeight: 600 }}>{p.repository}</td>
                  <td>{p.branch}</td>
                  <td><code style={{ color: 'var(--accent-blue)' }}>{p.commitSha?.substring(0, 7)}</code></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatTime(p.createdAt)}</td>
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
function PipelinesPage({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try { setPipelines(await api.getPipelines()) }
      catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const i = setInterval(load, 4000)
    return () => clearInterval(i)
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pipelines</h1>
      </div>
      <div className="table-container">
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
            </tr>
          </thead>
          <tbody>
            {pipelines.map(p => (
              <tr key={p.id} className="clickable-row" onClick={() => onNavigate(p.id)}>
                <td style={{ fontWeight: 600 }}>{p.repository}</td>
                <td>{p.branch}</td>
                <td><code style={{ color: 'var(--accent-blue)' }}>{p.commitSha?.substring(0, 7)}</code></td>
                <td>{p.author}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>{p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== Pipeline Detail Page ====================
function PipelineDetailPage({ id, onBack, onViewAnalysis }: { id: string; onBack: () => void; onViewAnalysis: (id: string) => void }) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading || !pipeline) return <Loading />

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back to Pipelines</button>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline Details</h1>
          <p className="page-subtitle">{pipeline.repository} / {pipeline.branch}</p>
        </div>
        {(pipeline.status === 'FAILED' || pipeline.status === 'ANALYZING' || pipeline.status === 'RESOLVED') && (
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }} onClick={() => onViewAnalysis(pipeline.id)}>
            <Bot size={16} style={{ marginRight: 8 }} /> View AI Analysis
          </button>
        )}
      </div>

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
          <div className="detail-label">Commit SHA</div>
          <div className="detail-value" style={{ fontFamily: 'monospace' }}>{pipeline.commitSha}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Author</div>
          <div className="detail-value">{pipeline.author}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Status</div>
          <div className="detail-value"><StatusBadge status={pipeline.status} /></div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Duration</div>
          <div className="detail-value">{pipeline.durationMs ? `${(pipeline.durationMs / 1000).toFixed(1)}s` : 'In progress...'}</div>
        </div>
      </div>

      {pipeline.testResults && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12, fontSize: 16, display: 'flex', alignItems: 'center' }}>
            <FileText size={16} style={{ marginRight: 8 }} /> Test Results
          </h3>
          <div className="code-block">{pipeline.testResults}</div>
        </div>
      )}

      {pipeline.buildLog && (
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16, display: 'flex', alignItems: 'center' }}>
            <FileText size={16} style={{ marginRight: 8 }} /> Build Log
          </h3>
          <div className="log-viewer">{colorizeLog(pipeline.buildLog)}</div>
        </div>
      )}
    </div>
  )
}

// ==================== Failures / AI Analysis Page ====================
function FailuresPage({ onNavigate }: { onNavigate: (pipelineId: string) => void }) {
  const [failures, setFailures] = useState<FailureAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      try { setFailures(await api.getFailures(Object.keys(filter).length > 0 ? filter : undefined)) }
      catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [filter])

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Failure Analysis</h1>
      </div>

      <div className="filters">
        <select className="filter-select" onChange={e => {
          const v = e.target.value
          setFilter(v ? { severity: v } : {})
        }}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="filter-select" onChange={e => {
          const v = e.target.value
          setFilter(v ? { failureType: v } : {})
        }}>
          <option value="">All Types</option>
          <option value="TEST_FAILURE">Test Failure</option>
          <option value="COMPILATION_ERROR">Compilation Error</option>
          <option value="RUNTIME_ERROR">Runtime Error</option>
        </select>
      </div>

      {failures.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bot size={48} /></div>
          <p>No failure analyses yet. Trigger a failing build to see AI analysis!</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Type</th>
                <th>Root Cause</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {failures.map(f => (
                <tr key={f.id} className="clickable-row" onClick={() => onNavigate(f.pipelineId)}>
                  <td style={{ fontWeight: 600 }}>{f.repository}</td>
                  <td><span className="badge badge-failed">{f.failureType}</span></td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.rootCause?.substring(0, 80)}...
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: f.confidence > 0.8 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
                      {(f.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatTime(f.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== Analysis Detail Page ====================
function AnalysisDetailPage({ pipelineId, onBack }: { pipelineId: string; onBack: () => void }) {
  const [analysis, setAnalysis] = useState<FailureAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <Loading />
  if (!analysis) return (
    <div>
      <button className="back-link" onClick={onBack}>← Back</button>
      <div className="empty-state">
        <div className="empty-state-icon"><Hourglass size={48} /></div>
        <p>AI analysis is still in progress. This page will auto-refresh...</p>
      </div>
    </div>
  )

  const confidence = analysis.confidence
  const confidenceClass = confidence > 0.8 ? 'confidence-high' : confidence > 0.5 ? 'confidence-medium' : 'confidence-low'

  let affectedFiles: string[] = []
  try { affectedFiles = JSON.parse(analysis.affectedFiles) } catch { affectedFiles = [analysis.affectedFiles] }

  return (
    <div>
      <button className="back-link" onClick={onBack}>← Back to Analysis List</button>

      <div className="analysis-panel">
        <div className="analysis-header">
          <div className="analysis-icon"><Bot size={32} /></div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>AI Root Cause Analysis</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {analysis.repository} — {analysis.commitSha?.substring(0, 7)}
            </p>
          </div>
          <SeverityBadge severity={analysis.severity} />
        </div>

        {/* Confidence */}
        <div className="analysis-section">
          <div className="analysis-section-title">Confidence Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 800 }}>{(confidence * 100).toFixed(0)}%</span>
            <div className="confidence-bar" style={{ flex: 1 }}>
              <div className={`confidence-fill ${confidenceClass}`} style={{ width: `${confidence * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Failure Type */}
        <div className="analysis-section">
          <div className="analysis-section-title">Failure Type</div>
          <span className="badge badge-failed" style={{ fontSize: 14, padding: '6px 16px' }}>{analysis.failureType}</span>
        </div>

        {/* Root Cause */}
        <div className="analysis-section">
          <div className="analysis-section-title">Root Cause</div>
          <div className="analysis-section-content">{analysis.rootCause}</div>
        </div>

        {/* Affected Files */}
        <div className="analysis-section">
          <div className="analysis-section-title">Affected Files</div>
          <div className="affected-files">
            {affectedFiles.map((f, i) => <span key={i} className="file-tag">{f}</span>)}
          </div>
        </div>

        {/* Explanation */}
        <div className="analysis-section">
          <div className="analysis-section-title">Detailed Explanation</div>
          <div className="analysis-section-content" style={{ whiteSpace: 'pre-wrap' }}>{analysis.explanation}</div>
        </div>

        {/* Suggested Fix */}
        <div className="analysis-section">
          <div className="analysis-section-title">Suggested Fix</div>
          <div className="code-block">{analysis.suggestedFix}</div>
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

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-ghost" onClick={handleMarkAllRead}>Mark All Read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={48} /></div>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}
                 onClick={async () => {
                   if (!n.read) {
                     await api.markRead(n.id)
                     setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                     onRefreshCount()
                   }
                 }}>
              <div className="notification-title">{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                {n.message?.substring(0, 200)}
              </div>
              <div className="notification-time">{formatTime(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Shared Components ====================

function StatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase()}`
  const icons: Record<string, React.ReactNode> = {
    QUEUED: <Hourglass size={14} style={{ marginRight: 4 }} />,
    RUNNING: <RefreshCw size={14} style={{ marginRight: 4 }} />,
    SUCCESS: <CheckCircle size={14} style={{ marginRight: 4 }} />,
    FAILED: <XCircle size={14} style={{ marginRight: 4 }} />,
    ANALYZING: <Bot size={14} style={{ marginRight: 4 }} />,
    RESOLVED: <CheckCircle size={14} style={{ marginRight: 4 }} />
  }
  return <span className={cls} style={{ display: 'inline-flex', alignItems: 'center' }}>{icons[status] || '•'} {status}</span>
}

function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`badge badge-${severity?.toLowerCase()}`}>{severity}</span>
}

function Loading() {
  return <div className="loading"><div className="spinner" /><span>Loading...</span></div>
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function colorizeLog(log: string): string {
  return log
}
