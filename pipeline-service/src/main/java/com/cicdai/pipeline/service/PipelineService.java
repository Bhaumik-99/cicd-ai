package com.cicdai.pipeline.service;

import com.cicdai.pipeline.dto.CicdEvent;
import com.cicdai.pipeline.model.Pipeline;
import com.cicdai.pipeline.model.PipelineStatus;
import com.cicdai.pipeline.repository.PipelineRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class PipelineService {

    private static final Logger log = LoggerFactory.getLogger(PipelineService.class);
    private static final String PIPELINE_EVENTS_TOPIC = "pipeline-events";

    private final PipelineRepository pipelineRepository;
    private final EventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public PipelineService(PipelineRepository pipelineRepository,
                           EventPublisher eventPublisher,
                           StringRedisTemplate redisTemplate,
                           ObjectMapper objectMapper) {
        this.pipelineRepository = pipelineRepository;
        this.eventPublisher = eventPublisher;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Create a new pipeline from a CODE_PUSHED event.
     */
    public Pipeline createPipeline(Map<String, Object> payload) {
        String repository = (String) payload.getOrDefault("repository", "unknown");
        String branch = (String) payload.getOrDefault("branch", "main");
        String commitSha = (String) payload.getOrDefault("commitSha", "unknown");
        String author = (String) payload.getOrDefault("author", "unknown");
        boolean injectBug = Boolean.TRUE.equals(payload.get("injectBug"));

        // Distributed lock to prevent duplicate pipeline creation
        String lockKey = "lock:pipeline:create:" + repository + ":" + commitSha;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(30));
        if (Boolean.FALSE.equals(acquired)) {
            log.warn("Pipeline creation already in progress for {}:{}", repository, commitSha);
            return null;
        }

        try {
            Pipeline pipeline = new Pipeline();
            pipeline.setId(UUID.randomUUID());
            pipeline.setRepository(repository);
            pipeline.setBranch(branch);
            pipeline.setCommitSha(commitSha);
            pipeline.setAuthor(author);
            pipeline.setStatus(PipelineStatus.QUEUED);
            pipeline.setCreatedAt(Instant.now());
            pipeline.setUpdatedAt(Instant.now());

            pipeline = pipelineRepository.save(pipeline);
            log.info("Created pipeline {} for {}/{} (commit: {})", pipeline.getId(), repository, branch, commitSha);

            // Cache status in Redis
            cacheStatus(pipeline);

            // Transition to RUNNING and publish event
            pipeline.setStatus(PipelineStatus.RUNNING);
            pipeline.setStartedAt(Instant.now());
            pipeline.setUpdatedAt(Instant.now());
            pipeline = pipelineRepository.save(pipeline);
            cacheStatus(pipeline);

            // Publish PIPELINE_STARTED event
            Map<String, Object> eventPayload = new HashMap<>();
            eventPayload.put("pipelineId", pipeline.getId().toString());
            eventPayload.put("repository", repository);
            eventPayload.put("branch", branch);
            eventPayload.put("commitSha", commitSha);
            eventPayload.put("author", author);
            eventPayload.put("injectBug", injectBug);

            CicdEvent event = CicdEvent.create("PIPELINE_STARTED", "pipeline-service", eventPayload);
            event.setPipelineId(pipeline.getId().toString());
            eventPublisher.publish(PIPELINE_EVENTS_TOPIC, event);

            log.info("Pipeline {} transitioned to RUNNING, published PIPELINE_STARTED", pipeline.getId());
            return pipeline;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    /**
     * Update pipeline status from build result events.
     */
    public Pipeline updateFromBuildResult(String pipelineId, String eventType,
                                          String buildLog, String testResults, String errorMessage) {
        UUID id = UUID.fromString(pipelineId);
        Optional<Pipeline> optPipeline = pipelineRepository.findById(id);
        if (optPipeline.isEmpty()) {
            log.error("Pipeline {} not found", pipelineId);
            return null;
        }

        Pipeline pipeline = optPipeline.get();

        if ("BUILD_SUCCEEDED".equals(eventType)) {
            pipeline.setStatus(PipelineStatus.SUCCESS);
        } else if ("BUILD_FAILED".equals(eventType)) {
            pipeline.setStatus(PipelineStatus.FAILED);
        }

        pipeline.setBuildLog(buildLog);
        pipeline.setTestResults(testResults);
        pipeline.setErrorMessage(errorMessage);
        pipeline.setCompletedAt(Instant.now());

        if (pipeline.getStartedAt() != null) {
            pipeline.setDurationMs(
                    Duration.between(pipeline.getStartedAt(), pipeline.getCompletedAt()).toMillis());
        }

        pipeline.setUpdatedAt(Instant.now());
        pipeline = pipelineRepository.save(pipeline);
        cacheStatus(pipeline);

        log.info("Pipeline {} updated to {} (duration: {}ms)",
                pipelineId, pipeline.getStatus(), pipeline.getDurationMs());
        return pipeline;
    }

    /**
     * Transition pipeline to ANALYZING status.
     */
    public void transitionToAnalyzing(String pipelineId) {
        UUID id = UUID.fromString(pipelineId);
        pipelineRepository.findById(id).ifPresent(pipeline -> {
            pipeline.setStatus(PipelineStatus.ANALYZING);
            pipeline.setUpdatedAt(Instant.now());
            pipelineRepository.save(pipeline);
            cacheStatus(pipeline);
            log.info("Pipeline {} transitioned to ANALYZING", pipelineId);
        });
    }

    /**
     * Transition pipeline to RESOLVED status.
     */
    public void transitionToResolved(String pipelineId) {
        UUID id = UUID.fromString(pipelineId);
        pipelineRepository.findById(id).ifPresent(pipeline -> {
            pipeline.setStatus(PipelineStatus.RESOLVED);
            pipeline.setUpdatedAt(Instant.now());
            pipelineRepository.save(pipeline);
            cacheStatus(pipeline);
            log.info("Pipeline {} transitioned to RESOLVED", pipelineId);
        });
    }

    public List<Pipeline> getAllPipelines() {
        return pipelineRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Pipeline> getPipeline(UUID id) {
        return pipelineRepository.findById(id);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", pipelineRepository.count());
        stats.put("successful", pipelineRepository.countByStatus(PipelineStatus.SUCCESS));
        stats.put("failed", pipelineRepository.countByStatus(PipelineStatus.FAILED));
        stats.put("running", pipelineRepository.countByStatus(PipelineStatus.RUNNING));
        stats.put("queued", pipelineRepository.countByStatus(PipelineStatus.QUEUED));
        stats.put("analyzing", pipelineRepository.countByStatus(PipelineStatus.ANALYZING));
        stats.put("resolved", pipelineRepository.countByStatus(PipelineStatus.RESOLVED));

        long total = (long) stats.get("total");
        long failed = (long) stats.get("failed");
        stats.put("failureRate", total > 0 ? Math.round((double) failed / total * 10000.0) / 100.0 : 0.0);

        Double avgDuration = pipelineRepository.averageDurationMs();
        stats.put("averageBuildTimeMs", avgDuration != null ? Math.round(avgDuration) : 0);

        return stats;
    }

    private void cacheStatus(Pipeline pipeline) {
        try {
            String key = "pipeline:status:" + pipeline.getId();
            String value = objectMapper.writeValueAsString(Map.of(
                    "id", pipeline.getId().toString(),
                    "status", pipeline.getStatus().name(),
                    "repository", pipeline.getRepository(),
                    "branch", pipeline.getBranch(),
                    "commitSha", pipeline.getCommitSha()
            ));
            redisTemplate.opsForValue().set(key, value, Duration.ofHours(1));
        } catch (Exception e) {
            log.warn("Failed to cache pipeline status: {}", e.getMessage());
        }
    }
}
