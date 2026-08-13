-- ============================================
-- CICD-AI Database Initialization
-- ============================================
-- This script runs on first PostgreSQL startup

-- Pipeline Service tables
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY,
    repository VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    commit_sha VARCHAR(64) NOT NULL,
    author VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    build_log TEXT,
    test_results TEXT,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipelines_repository ON pipelines(repository);
CREATE INDEX IF NOT EXISTS idx_pipelines_created_at ON pipelines(created_at DESC);

-- Failure Service tables
CREATE TABLE IF NOT EXISTS failure_analyses (
    id UUID PRIMARY KEY,
    pipeline_id UUID NOT NULL,
    failure_type VARCHAR(100),
    root_cause TEXT,
    confidence DECIMAL(3,2),
    affected_files TEXT,
    explanation TEXT,
    suggested_fix TEXT,
    severity VARCHAR(20),
    build_log TEXT,
    commit_sha VARCHAR(64),
    repository VARCHAR(255),
    branch VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_analyses_pipeline ON failure_analyses(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_failure_analyses_severity ON failure_analyses(severity);
CREATE INDEX IF NOT EXISTS idx_failure_analyses_created ON failure_analyses(created_at DESC);

CREATE TABLE IF NOT EXISTS failure_history (
    id UUID PRIMARY KEY,
    pipeline_id UUID NOT NULL,
    repository VARCHAR(255),
    failure_fingerprint VARCHAR(64),
    failure_type VARCHAR(100),
    root_cause TEXT,
    severity VARCHAR(20),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_history_fingerprint ON failure_history(failure_fingerprint);
CREATE INDEX IF NOT EXISTS idx_failure_history_repository ON failure_history(repository);
CREATE INDEX IF NOT EXISTS idx_failure_history_created ON failure_history(created_at DESC);

-- Notification Service tables
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    pipeline_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    severity VARCHAR(20),
    read BOOLEAN DEFAULT FALSE,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
