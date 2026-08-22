import { useState, useEffect, useCallback, useRef } from 'react'
import { api, Pipeline, PipelineStats, FailureAnalysis, Notification } from './api'

// ── Scroll-reveal hook ──────────────────────────────────────────────────────
function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ── GitHub SVG icon ─────────────────────────────────────────────────────────
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<string>('dashboard')
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'info' | 'success' | 'danger' } | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const refreshUnread = useCallback(async () => {
    try { setUnreadCount((await api.getUnreadCount()).count) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshUnread()
    const id = setInterval(refreshUnread, 5000)
    return () => clearInterval(id)
  }, [refreshUnread])

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'danger' = 'info') => {
    setToast({ title, message, type })
    setTimeout(() => setToast(null), 4500)
  }

  const navTo = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const navigateToPipeline = (id: string) => { setSelectedPipelineId(id); navTo('pipeline-detail') }
  const navigateToAnalysis  = (id: string) => { setSelectedFailureId(id);  navTo('analysis-detail') }

  const handleSimulate = async (injectBug: boolean) => {
    setIsSimulating(true)
    try {
      await api.simulatePush(injectBug)
      refreshUnread()
      showToast(
        injectBug ? 'Failure injected' : 'Clean build dispatched',
        injectBug
          ? 'Simulated NullPointerException in PaymentService. AI triage triggered.'
          : 'Simulated valid commit. Build should pass all checks.',
        injectBug ? 'danger' : 'success'
      )
    } catch {
      showToast('Simulation error', 'Failed to dispatch webhook event.', 'danger')
    } finally {
      setIsSimulating(false)
    }
  }

  const pageLabel: Record<string, string> = {
    dashboard: 'Dashboard',
    pipelines: 'Pipelines',
    'pipeline-detail': 'Pipeline Detail',
    failures: 'AI Analysis',
    'analysis-detail': 'Root Cause Report',
    notifications: 'Notifications',
  }

  const navItems = [
    { key: 'dashboard',   label: 'Dashboard',    icon: 'ph-squares-four-bold' },
    { key: 'pipelines',   label: 'Pipelines',    icon: 'ph-git-branch-bold' },
    { key: 'failures',    label: 'AI Analysis',  icon: 'ph-brain-bold' },
    { key: 'notifications', label: 'Alerts',     icon: 'ph-bell-bold', badge: unreadCount },
  ]

  const isActive = (key: string) =>
    key === 'pipelines'
      ? page === 'pipelines' || page === 'pipeline-detail'
      : key === 'failures'
      ? page === 'failures' || page === 'analysis-detail'
      : page === key

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">
              <i className="ph-circuit-board-bold" style={{ fontSize: 14 }} />
            </div>
            <div>
              <div className="logo-name">CICD-AI</div>
              <div className="logo-sub">Failure Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Platform</div>
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-item ${isActive(item.key) ? 'active' : ''}`}
              onClick={() => navTo(item.key)}
            >
              <i className={item.icon} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="telemetry-mini">
            <div className="telemetry-row">
              <span>AI Analyzer</span>
              <span className="telemetry-val" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="pulse-dot" />
                <span style={{ color: 'var(--pale-green-ink)' }}>Online</span>
              </span>
            </div>
            <div className="telemetry-row" style={{ marginTop: 4 }}>
              <span>Engine</span>
              <span className="telemetry-val">GPT-4o / Claude</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="btn btn-danger btn-sm btn-full"
              disabled={isSimulating}
              onClick={() => handleSimulate(true)}
            >
              <i className="ph-bug-bold" />
              {isSimulating ? 'Running...' : 'Inject Bug'}
            </button>
            <button
              className="btn btn-success-light btn-sm btn-full"
              disabled={isSimulating}
              onClick={() => handleSimulate(false)}
            >
              <i className="ph-check-circle-bold" />
              Clean Build
            </button>
          </div>

          <a
            href="https://github.com/Bhaumik-99/cicd-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-github btn-full"
            style={{ marginTop: 2 }}
          >
            <GithubIcon size={14} />
            <span>GitHub Repo</span>
            <i className="ph-arrow-up-right-bold" style={{ fontSize: 12, marginLeft: 'auto' }} />
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Top Nav */}
        <header className="top-nav">
          <div className="breadcrumb">
            <i className="ph-circuit-board-bold" style={{ fontSize: 14 }} />
            <span>CICD-AI</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{pageLabel[page] ?? 'Dashboard'}</span>
          </div>
          <div className="top-nav-actions">
            <span className="status-pill">
              <span className="pulse-dot" />
              All systems operational
            </span>
            <a
              href="https://github.com/Bhaumik-99/cicd-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-github"
            >
              <GithubIcon size={13} />
              <span>GitHub Repository</span>
              <i className="ph-arrow-up-right-bold" style={{ fontSize: 11 }} />
            </a>
          </div>
        </header>

        <div className="page-content">
          {page === 'dashboard' && (
            <DashboardPage
              onNavigatePipeline={navigateToPipeline}
              onNavigateAnalysis={navigateToAnalysis}
            />
          )}
          {page === 'pipelines' && (
            <PipelinesPage
              onNavigate={navigateToPipeline}
              onNavigateAnalysis={navigateToAnalysis}
            />
          )}
          {page === 'pipeline-detail' && selectedPipelineId && (
            <PipelineDetailPage
              id={selectedPipelineId}
              onBack={() => navTo('pipelines')}
              onViewAnalysis={navigateToAnalysis}
            />
          )}
          {page === 'failures' && <FailuresPage onNavigate={navigateToAnalysis} />}
          {page === 'analysis-detail' && selectedFailureId && (
            <AnalysisDetailPage pipelineId={selectedFailureId} onBack={() => navTo('failures')} />
          )}
          {page === 'notifications' && <NotificationsPage onRefreshCount={refreshUnread} />}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <div className="toast-title">
            {toast.type === 'danger'  && <i className="ph-warning-circle-bold t-danger" />}
            {toast.type === 'success' && <i className="ph-check-circle-bold t-success" />}
            {toast.type === 'info'    && <i className="ph-info-bold t-info" />}
            {toast.title}
          </div>
          <div className="toast-body">{toast.message}</div>
        </div>
      )}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({
  onNavigatePipeline,
  onNavigateAnalysis,
}: {
  onNavigatePipeline: (id: string) => void
  onNavigateAnalysis: (id: string) => void
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
    const id = setInterval(refresh, 4000)
    return () => clearInterval(id)
  }, [refresh])

  if (loading && !stats) return <Loading />

  const statCards = [
    { label: 'Total Runs',      value: stats?.total ?? 0,      icon: 'ph-stack-bold',          iconCls: 'blue',   sub: 'All branches' },
    { label: 'Passed',          value: stats?.successful ?? 0,  icon: 'ph-check-circle-bold',   iconCls: 'green',  sub: 'All checks green' },
    { label: 'Failed',          value: stats?.failed ?? 0,      icon: 'ph-x-circle-bold',       iconCls: 'red',    sub: 'Triggered AI triage' },
    { label: 'AI Resolved',     value: stats?.resolved ?? 0,    icon: 'ph-brain-bold',          iconCls: 'blue',   sub: 'Root causes found' },
    { label: 'Failure Rate',    value: `${stats?.failureRate ?? 0}%`, icon: 'ph-chart-line-up-bold', iconCls: 'yellow', sub: 'Current interval' },
    { label: 'Avg Build Time',  value: stats?.averageBuildTimeMs ? `${(stats.averageBuildTimeMs / 1000).toFixed(1)}s` : '—',
                                       icon: 'ph-timer-bold',          iconCls: 'yellow', sub: 'End-to-end latency' },
  ]

  return (
    <div>
      <Reveal>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Overview</div>
            <h1 className="page-title">Pipeline Dashboard</h1>
            <p className="page-subtitle">
              Real-time build telemetry, AI-powered failure diagnosis, and system health.
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>
            <i className="ph-arrows-clockwise-bold" /> Refresh
          </button>
        </div>
      </Reveal>

      {/* Stats bento */}
      <div className="bento-grid">
        {statCards.map((s, i) => (
          <Reveal key={s.label} delay={i * 60} className="bento-card">
            <div className="stat-eyebrow">
              {s.label}
              <div className={`stat-icon ${s.iconCls}`}>
                <i className={s.icon} />
              </div>
            </div>
            <div className="stat-num">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </Reveal>
        ))}
      </div>

      {/* DAG */}
      <Reveal>
        <div className="dag-wrap">
          <div className="dag-label-bar">
            <span className="dag-label-title">
              <i className="ph-git-merge-bold" style={{ marginRight: 6 }} />
              Microservice Event Flow
            </span>
            <span className="badge badge-running">
              <i className="ph-lightning-bold" />
              Kafka KRaft
            </span>
          </div>
          <div className="dag-flow">
            {[
              { label: 'Git Push',      meta: 'GitHub',    icon: 'ph-git-branch-bold', cls: 'active' },
              { label: 'Webhook',       meta: ':8081',      icon: 'ph-webhook-logo-bold', cls: 'active' },
              { label: 'Build Worker',  meta: ':8083',      icon: 'ph-wrench-bold', cls: 'active' },
              { label: 'Maven Tests',   meta: 'JUnit',      icon: 'ph-test-tube-bold',
                cls: (stats?.failed ?? 0) > 0 ? 'failed' : 'success' },
              { label: 'AI Analyzer',   meta: ':8084',      icon: 'ph-brain-bold', cls: 'active' },
              { label: 'Notifier',      meta: ':8086',      icon: 'ph-bell-ringing-bold', cls: 'success' },
            ].map((node, i, arr) => (
              <span key={node.label} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? undefined : 0 }}>
                <div className={`dag-node ${node.cls}`}>
                  <div className="dag-circle"><i className={node.icon} /></div>
                  <span className="dag-node-name">{node.label}</span>
                  <span className="dag-node-meta">{node.meta}</span>
                </div>
                {i < arr.length - 1 && <div className={`dag-edge ${node.cls}`} />}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Recent pipelines */}
      <Reveal>
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              <i className="ph-git-branch-bold" />
              Recent Executions
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Auto-refreshing</span>
          </div>
          {pipelines.length === 0 ? (
            <EmptyState
              icon="ph-rocket-launch-bold"
              title="No pipelines yet"
              desc='Click "Inject Bug" in the sidebar to trigger a demo pipeline run.'
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Branch</th>
                  <th>Commit</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Started</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pipelines.map(p => (
                  <tr key={p.id} className="row-clickable" onClick={() => onNavigatePipeline(p.id)}>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.repository}</td>
                    <td><span className="branch-tag"><i className="ph-git-branch-bold" /> {p.branch}</span></td>
                    <td><span className="commit-tag">{p.commitSha?.substring(0, 7)}</span></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{formatTime(p.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {(p.status === 'FAILED' || p.status === 'RESOLVED' || p.status === 'ANALYZING') ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={e => { e.stopPropagation(); onNavigateAnalysis(p.id) }}
                        >
                          <i className="ph-brain-bold" /> AI Report
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onNavigatePipeline(p.id) }}>
                          Details <i className="ph-arrow-right-bold" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Reveal>
    </div>
  )
}

// ── Pipelines Page ───────────────────────────────────────────────────────────
function PipelinesPage({
  onNavigate,
  onNavigateAnalysis,
}: {
  onNavigate: (id: string) => void
  onNavigateAnalysis: (id: string) => void
}) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = useCallback(async () => {
    try { setPipelines(await api.getPipelines()) } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [load])

  const filtered = pipelines.filter(p => {
    const q = search.toLowerCase()
    const matchSearch =
      p.repository.toLowerCase().includes(q) ||
      p.branch.toLowerCase().includes(q) ||
      p.commitSha.toLowerCase().includes(q) ||
      (p.author && p.author.toLowerCase().includes(q))
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading && pipelines.length === 0) return <Loading />

  return (
    <div>
      <Reveal>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">CI/CD</div>
            <h1 className="page-title">Pipeline Registry</h1>
            <p className="page-subtitle">All CI/CD workflow runs, build logs, and test execution records.</p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              <i className="ph-list-bullets-bold" />
              All Pipelines
            </div>
            <div className="table-toolbar-right">
              <div className="search-wrap">
                <i className="ph-magnifying-glass-bold search-icon" />
                <input
                  className="search-input"
                  type="text"
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
                <option value="ALL">All statuses</option>
                <option value="SUCCESS">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="RESOLVED">AI Resolved</option>
                <option value="RUNNING">Running</option>
                <option value="QUEUED">Queued</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {filtered.length} / {pipelines.length}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="ph-funnel-bold" title="No results" desc="Try adjusting the search term or status filter." />
          ) : (
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
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="row-clickable" onClick={() => onNavigate(p.id)}>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.repository}</td>
                    <td><span className="branch-tag"><i className="ph-git-branch-bold" /> {p.branch}</span></td>
                    <td><span className="commit-tag">{p.commitSha?.substring(0, 7)}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{p.author}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{formatTime(p.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {(p.status === 'FAILED' || p.status === 'RESOLVED') ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={e => { e.stopPropagation(); onNavigateAnalysis(p.id) }}
                        >
                          <i className="ph-brain-bold" /> AI Report
                        </button>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onNavigate(p.id) }}>
                          Details <i className="ph-arrow-right-bold" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Reveal>
    </div>
  )
}

// ── Pipeline Detail ──────────────────────────────────────────────────────────
function PipelineDetailPage({
  id,
  onBack,
  onViewAnalysis,
}: {
  id: string
  onBack: () => void
  onViewAnalysis: (id: string) => void
}) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [logSearch, setLogSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try { setPipeline(await api.getPipeline(id)) } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [id])

  const handleCopy = () => {
    if (!pipeline?.buildLog) return
    navigator.clipboard.writeText(pipeline.buildLog)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !pipeline) return <Loading />

  const isFailed = pipeline.status === 'FAILED' || pipeline.status === 'RESOLVED' || pipeline.status === 'ANALYZING'
  const logLines = (pipeline.buildLog ?? '').split('\n')
  const filteredLines = logSearch
    ? logLines.filter(l => l.toLowerCase().includes(logSearch.toLowerCase()))
    : logLines

  const dagStages = [
    { label: 'Git Checkout',  meta: 'Completed',                                                icon: 'ph-git-branch-bold',     cls: 'success' },
    { label: 'Compile',       meta: 'Java 21 / Maven',                                          icon: 'ph-wrench-bold',          cls: 'success' },
    { label: 'Tests',         meta: isFailed ? '1 Failed' : 'All Passed',                       icon: 'ph-test-tube-bold',       cls: isFailed ? 'failed' : 'success' },
    { label: 'AI Diagnostic', meta: isFailed ? 'Root cause analyzed' : 'Skipped (clean)',       icon: 'ph-brain-bold',           cls: isFailed ? 'active' : 'success' },
  ]

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        <i className="ph-arrow-left-bold" /> Back to Pipelines
      </button>

      <Reveal>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Pipeline Detail</div>
            <h1 className="page-title">{pipeline.repository}</h1>
            <p className="page-subtitle">
              Branch <span className="branch-tag"><i className="ph-git-branch-bold" /> {pipeline.branch}</span>{' '}
              &nbsp;Commit <span className="commit-tag">{pipeline.commitSha?.substring(0, 7)}</span>
            </p>
          </div>
          {isFailed && (
            <button className="btn btn-primary" onClick={() => onViewAnalysis(pipeline.id)}>
              <i className="ph-brain-bold" /> View AI Root-Cause Report
            </button>
          )}
        </div>
      </Reveal>

      {/* DAG */}
      <Reveal>
        <div className="dag-wrap" style={{ marginBottom: 24 }}>
          <div className="dag-label-bar">
            <span className="dag-label-title">Execution Stages</span>
            <StatusBadge status={pipeline.status} />
          </div>
          <div className="dag-flow">
            {dagStages.map((node, i) => (
              <span key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`dag-node ${node.cls}`}>
                  <div className="dag-circle"><i className={node.icon} /></div>
                  <span className="dag-node-name">{node.label}</span>
                  <span className="dag-node-meta">{node.meta}</span>
                </div>
                {i < dagStages.length - 1 && <div className={`dag-edge ${node.cls}`} />}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Metadata detail cards */}
      <Reveal>
        <div className="detail-grid">
          {[
            { label: 'Repository', value: pipeline.repository },
            { label: 'Branch',     value: pipeline.branch },
            { label: 'Author',     value: pipeline.author || '—' },
            { label: 'Status',     value: <StatusBadge status={pipeline.status} /> },
            { label: 'Duration',   value: pipeline.durationMs ? `${(pipeline.durationMs / 1000).toFixed(1)}s` : 'In progress' },
            { label: 'Started',    value: formatTime(pipeline.createdAt) },
          ].map(d => (
            <div key={d.label} className="detail-card">
              <div className="detail-card-label">{d.label}</div>
              <div className="detail-card-value">{d.value}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Test results */}
      {pipeline.testResults && (
        <Reveal>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <div className="table-toolbar">
              <div className="table-toolbar-title">
                <i className="ph-flask-bold" /> Test Execution Summary
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div className={`code-block ${isFailed ? 'log-line-error' : 'log-line-info'}`} style={{ fontSize: 12.5 }}>
                {pipeline.testResults}
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Build log terminal */}
      {pipeline.buildLog && (
        <Reveal>
          <div className="terminal-wrap">
            <div className="terminal-titlebar" style={{ position: 'relative' }}>
              <div className="terminal-dots">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
              </div>
              <span className="terminal-fname">console.stdout — maven build</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="search-wrap">
                  <i className="ph-magnifying-glass-bold search-icon" />
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Filter lines..."
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    style={{ width: 140 }}
                  />
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                  <i className={copied ? 'ph-check-bold' : 'ph-copy-bold'} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="terminal-body">
              {filteredLines.map((line, idx) => {
                const isErr = line.includes('[ERROR]') || line.includes('FAILURE') || line.includes('NullPointerException')
                const isInfo = line.includes('[INFO]')
                return (
                  <span key={idx} className={`log-line ${isErr ? 'log-line-error' : isInfo ? 'log-line-info' : ''}`}>
                    <span className="log-num">{(idx + 1).toString().padStart(3, ' ')}</span>
                    {line}
                    {'\n'}
                  </span>
                )
              })}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  )
}

// ── Failures / AI Analysis List ──────────────────────────────────────────────
function FailuresPage({ onNavigate }: { onNavigate: (pipelineId: string) => void }) {
  const [failures, setFailures] = useState<FailureAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setFailures(await api.getFailures(severityFilter ? { severity: severityFilter } : undefined))
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [severityFilter])

  if (loading && failures.length === 0) return <Loading />

  return (
    <div>
      <Reveal>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">AI Intelligence</div>
            <h1 className="page-title">Failure Analysis Feed</h1>
            <p className="page-subtitle">
              Autonomous diagnosis of build failures — stack traces, error logs, and AI-generated fixes.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              <i className="ph-brain-bold" />
              AI Diagnoses
            </div>
            <div className="table-toolbar-right">
              <select
                className="filter-select"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {failures.length} records
              </span>
            </div>
          </div>

          {failures.length === 0 ? (
            <EmptyState
              icon="ph-brain-bold"
              title="No failures detected"
              desc='Trigger "Inject Bug" in the sidebar to run a simulated failure and watch the AI diagnose it.'
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Type</th>
                  <th>Root Cause</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'right' }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {failures.map(f => (
                  <tr key={f.id} className="row-clickable" onClick={() => onNavigate(f.pipelineId)}>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{f.repository}</td>
                    <td><span className="badge badge-failed">{f.failureType}</span></td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>
                      {f.rootCause?.substring(0, 70)}...
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: 13,
                        color: f.confidence > 0.8 ? 'var(--pale-green-ink)' : 'var(--pale-yellow-ink)',
                      }}>
                        {(f.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td><SeverityBadge severity={f.severity} /></td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{formatTime(f.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm">
                        View <i className="ph-arrow-up-right-bold" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Reveal>
    </div>
  )
}

// ── Analysis Detail Page ─────────────────────────────────────────────────────
function AnalysisDetailPage({
  pipelineId,
  onBack,
}: {
  pipelineId: string
  onBack: () => void
}) {
  const [analysis, setAnalysis] = useState<FailureAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedFix, setCopiedFix] = useState(false)

  useEffect(() => {
    const load = async () => {
      try { setAnalysis(await api.getFailureByPipeline(pipelineId)) } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
    const id = setInterval(load, 3000)
    return () => clearInterval(id)
  }, [pipelineId])

  if (loading) return <Loading />
  if (!analysis) return (
    <div>
      <button className="back-link" onClick={onBack}><i className="ph-arrow-left-bold" /> Back</button>
      <EmptyState
        icon="ph-hourglass-medium-bold"
        title="Analysis in progress"
        desc="The AI is reading build logs, Surefire XML reports, and stack traces. This usually takes a few seconds."
      />
    </div>
  )

  const conf = analysis.confidence
  const confCls = conf > 0.8 ? 'high' : conf > 0.5 ? 'medium' : 'low'
  let affectedFiles: string[] = []
  try { affectedFiles = JSON.parse(analysis.affectedFiles) } catch { affectedFiles = [analysis.affectedFiles] }

  const handleCopyFix = () => {
    if (!analysis.suggestedFix) return
    navigator.clipboard.writeText(analysis.suggestedFix)
    setCopiedFix(true)
    setTimeout(() => setCopiedFix(false), 2000)
  }

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        <i className="ph-arrow-left-bold" /> Back to Failure Feed
      </button>

      <Reveal>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">AI Root-Cause Report</div>
            <h1 className="page-title">{analysis.repository}</h1>
            <p className="page-subtitle">
              Branch <span className="branch-tag"><i className="ph-git-branch-bold" /> {analysis.branch}</span>{' '}
              &nbsp;Commit <span className="commit-tag">{analysis.commitSha?.substring(0, 7)}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <SeverityBadge severity={analysis.severity} />
            <span className="badge badge-failed">{analysis.failureType}</span>
          </div>
        </div>
      </Reveal>

      {/* Confidence */}
      <Reveal>
        <div className="conf-wrap">
          <div className="conf-header">
            <span className="conf-label">AI Diagnostic Confidence</span>
            <span className="conf-value">{(conf * 100).toFixed(0)}%</span>
          </div>
          <div className="conf-track">
            <div className={`conf-fill ${confCls}`} style={{ width: `${conf * 100}%` }} />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="analysis-wrap">
          {/* Header */}
          <div className="analysis-hdr">
            <div className="analysis-icon">
              <i className="ph-brain-bold" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}>AI Root Cause Analysis</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                Analyzed build logs, Surefire XML, and stack trace
              </div>
            </div>
          </div>

          {/* Root cause */}
          <div className="analysis-section">
            <div className="analysis-section-title">
              <i className="ph-warning-circle-bold" style={{ color: 'var(--pale-red-ink)' }} />
              Root Cause
            </div>
            <div className="analysis-root-cause">{analysis.rootCause}</div>
          </div>

          {/* Affected files */}
          <div className="analysis-section">
            <div className="analysis-section-title">
              <i className="ph-file-code-bold" />
              Affected Files
            </div>
            <div className="file-list">
              {affectedFiles.map((f, i) => (
                <span key={i} className="file-tag">
                  <i className="ph-file-code-bold" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="analysis-section">
            <div className="analysis-section-title">
              <i className="ph-magnifying-glass-bold" />
              Detailed Diagnostic
            </div>
            <div className="analysis-body">{analysis.explanation}</div>
          </div>

          {/* Suggested fix */}
          <div className="analysis-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="analysis-section-title" style={{ marginBottom: 0 }}>
                <i className="ph-wrench-bold" style={{ color: 'var(--pale-green-ink)' }} />
                Suggested Code Fix
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleCopyFix}>
                <i className={copiedFix ? 'ph-check-bold' : 'ph-copy-bold'} />
                {copiedFix ? 'Copied' : 'Copy Fix'}
              </button>
            </div>
            <div className="code-block">{analysis.suggestedFix}</div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

// ── Notifications Page ───────────────────────────────────────────────────────
function NotificationsPage({ onRefreshCount }: { onRefreshCount: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try { setNotifications(await api.getNotifications()) } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleMarkAll = async () => {
    await api.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    onRefreshCount()
  }

  if (loading && notifications.length === 0) return <Loading />

  return (
    <div>
      <Reveal>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Alerts</div>
            <h1 className="page-title">Notification Center</h1>
            <p className="page-subtitle">Real-time alerts from the Notification microservice (:8086).</p>
          </div>
          {notifications.some(n => !n.read) && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAll}>
              <i className="ph-check-circle-bold" /> Mark all read
            </button>
          )}
        </div>
      </Reveal>

      <Reveal>
        {notifications.length === 0 ? (
          <EmptyState
            icon="ph-bell-simple-slash-bold"
            title="No alerts"
            desc="All pipelines are healthy. Alerts appear here when a build fails or the AI completes an analysis."
          />
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={async () => {
                  if (!n.read) {
                    await api.markRead(n.id)
                    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                    onRefreshCount()
                  }
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div className="notif-title">{n.title}</div>
                    <SeverityBadge severity={n.severity || 'MEDIUM'} />
                  </div>
                  <div className="notif-body">{n.message}</div>
                  <div className="notif-time">{formatTime(n.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  )
}

// ── Reusable helpers ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = (status ?? 'QUEUED').toUpperCase()
  const map: Record<string, { cls: string; icon: string }> = {
    QUEUED:    { cls: 'badge-queued',    icon: 'ph-hourglass-bold' },
    RUNNING:   { cls: 'badge-running',   icon: 'ph-arrows-clockwise-bold' },
    SUCCESS:   { cls: 'badge-success',   icon: 'ph-check-circle-bold' },
    FAILED:    { cls: 'badge-failed',    icon: 'ph-x-circle-bold' },
    ANALYZING: { cls: 'badge-analyzing', icon: 'ph-brain-bold' },
    RESOLVED:  { cls: 'badge-resolved',  icon: 'ph-check-circle-bold' },
  }
  const { cls, icon } = map[s] ?? { cls: 'badge-queued', icon: 'ph-hourglass-bold' }
  return (
    <span className={`badge ${cls}`}>
      <i className={icon} /> {s}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity ?? 'LOW').toUpperCase()
  const map: Record<string, string> = {
    CRITICAL: 'badge-critical',
    HIGH:     'badge-high',
    MEDIUM:   'badge-medium',
    LOW:      'badge-low',
  }
  return <span className={`badge ${map[s] ?? 'badge-low'}`}>{s}</span>
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="empty-state">
      <i className={`${icon} empty-icon`} />
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
    </div>
  )
}

function Loading() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Loading data...</span>
    </div>
  )
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return iso }
}
