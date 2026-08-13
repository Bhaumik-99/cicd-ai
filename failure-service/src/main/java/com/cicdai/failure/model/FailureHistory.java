package com.cicdai.failure.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "failure_history")
public class FailureHistory {

    @Id
    private UUID id;

    @Column(name = "pipeline_id", nullable = false)
    private UUID pipelineId;

    private String repository;

    @Column(name = "failure_fingerprint")
    private String failureFingerprint;

    @Column(name = "failure_type")
    private String failureType;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    private String severity;
    private boolean resolved;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPipelineId() { return pipelineId; }
    public void setPipelineId(UUID pipelineId) { this.pipelineId = pipelineId; }
    public String getRepository() { return repository; }
    public void setRepository(String repository) { this.repository = repository; }
    public String getFailureFingerprint() { return failureFingerprint; }
    public void setFailureFingerprint(String fingerprint) { this.failureFingerprint = fingerprint; }
    public String getFailureType() { return failureType; }
    public void setFailureType(String failureType) { this.failureType = failureType; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
