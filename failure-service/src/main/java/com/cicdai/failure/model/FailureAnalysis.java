package com.cicdai.failure.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "failure_analyses")
public class FailureAnalysis {

    @Id
    private UUID id;

    @Column(name = "pipeline_id", nullable = false)
    private UUID pipelineId;

    @Column(name = "failure_type")
    private String failureType;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    private BigDecimal confidence;

    @Column(name = "affected_files", columnDefinition = "TEXT")
    private String affectedFiles;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "suggested_fix", columnDefinition = "TEXT")
    private String suggestedFix;

    private String severity;

    @Column(name = "build_log", columnDefinition = "TEXT")
    private String buildLog;

    @Column(name = "commit_sha")
    private String commitSha;

    private String repository;
    private String branch;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPipelineId() { return pipelineId; }
    public void setPipelineId(UUID pipelineId) { this.pipelineId = pipelineId; }
    public String getFailureType() { return failureType; }
    public void setFailureType(String failureType) { this.failureType = failureType; }
    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public String getAffectedFiles() { return affectedFiles; }
    public void setAffectedFiles(String affectedFiles) { this.affectedFiles = affectedFiles; }
    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
    public String getSuggestedFix() { return suggestedFix; }
    public void setSuggestedFix(String suggestedFix) { this.suggestedFix = suggestedFix; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getBuildLog() { return buildLog; }
    public void setBuildLog(String buildLog) { this.buildLog = buildLog; }
    public String getCommitSha() { return commitSha; }
    public void setCommitSha(String commitSha) { this.commitSha = commitSha; }
    public String getRepository() { return repository; }
    public void setRepository(String repository) { this.repository = repository; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
