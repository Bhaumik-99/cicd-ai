package com.cicdai.worker.consumer;

import com.cicdai.worker.dto.CicdEvent;
import com.cicdai.worker.service.BuildExecutor;
import com.cicdai.worker.service.EventPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class PipelineEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(PipelineEventConsumer.class);
    private static final String BUILD_EVENTS_TOPIC = "build-events";

    private final BuildExecutor buildExecutor;
    private final EventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public PipelineEventConsumer(BuildExecutor buildExecutor,
                                  EventPublisher eventPublisher,
                                  StringRedisTemplate redisTemplate,
                                  ObjectMapper objectMapper) {
        this.buildExecutor = buildExecutor;
        this.eventPublisher = eventPublisher;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "pipeline-events", groupId = "build-worker-group")
    public void handlePipelineEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();

            if (!"PIPELINE_STARTED".equals(eventType)) {
                return;
            }

            JsonNode payload = event.path("payload");
            String pipelineId = payload.path("pipelineId").asText();
            String repository = payload.path("repository").asText("demo-repo");
            String commitSha = payload.path("commitSha").asText("unknown");
            String branch = payload.path("branch").asText("main");
            boolean injectBug = payload.path("injectBug").asBoolean(false);

            log.info("Received PIPELINE_STARTED for pipeline {} (repo: {}, injectBug: {})",
                    pipelineId, repository, injectBug);

            // Distributed lock to prevent duplicate processing
            String lockKey = "lock:build:" + pipelineId;
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofMinutes(5));
            if (Boolean.FALSE.equals(acquired)) {
                log.warn("Build already in progress for pipeline {}", pipelineId);
                return;
            }

            try {
                // Track job state in Redis
                redisTemplate.opsForValue().set("build:state:" + pipelineId, "RUNNING", Duration.ofMinutes(10));

                // Execute the build
                Map<String, Object> buildResult = buildExecutor.executeBuild(
                        repository, commitSha, branch, injectBug);

                // Update job state
                boolean success = (boolean) buildResult.get("success");
                redisTemplate.opsForValue().set("build:state:" + pipelineId,
                        success ? "COMPLETED" : "FAILED", Duration.ofMinutes(10));

                // Build the event payload
                Map<String, Object> eventPayload = new HashMap<>(buildResult);
                eventPayload.put("pipelineId", pipelineId);

                // Create and publish the appropriate event
                String buildEventType = success ? "BUILD_SUCCEEDED" : "BUILD_FAILED";
                CicdEvent buildEvent = CicdEvent.create(buildEventType, "build-worker", eventPayload);
                buildEvent.setPipelineId(pipelineId);

                eventPublisher.publish(BUILD_EVENTS_TOPIC, buildEvent);

                log.info("Published {} for pipeline {} (duration: {}ms)",
                        buildEventType, pipelineId, buildResult.get("durationMs"));

            } finally {
                redisTemplate.delete(lockKey);
            }

        } catch (Exception e) {
            log.error("Error processing pipeline event: {}", e.getMessage(), e);
        }
    }
}
