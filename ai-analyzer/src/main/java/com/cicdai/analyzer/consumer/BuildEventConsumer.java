package com.cicdai.analyzer.consumer;

import com.cicdai.analyzer.dto.AnalysisResult;
import com.cicdai.analyzer.dto.CicdEvent;
import com.cicdai.analyzer.service.EventPublisher;
import com.cicdai.analyzer.service.FailureAnalyzer;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.time.Duration;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;

@Component
public class BuildEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(BuildEventConsumer.class);
    private static final String AI_ANALYSIS_TOPIC = "ai-analysis-events";

    private final FailureAnalyzer failureAnalyzer;
    private final EventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public BuildEventConsumer(FailureAnalyzer failureAnalyzer,
                               EventPublisher eventPublisher,
                               StringRedisTemplate redisTemplate,
                               ObjectMapper objectMapper) {
        this.failureAnalyzer = failureAnalyzer;
        this.eventPublisher = eventPublisher;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "build-events", groupId = "ai-analyzer-group")
    public void handleBuildEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();

            // Only analyze failed builds
            if (!"BUILD_FAILED".equals(eventType)) {
                log.debug("Ignoring event type: {}", eventType);
                return;
            }

            String pipelineId = event.path("pipelineId").asText();
            if (pipelineId == null || pipelineId.isEmpty()) {
                pipelineId = event.path("payload").path("pipelineId").asText();
            }

            log.info("Received BUILD_FAILED for pipeline {}, starting AI analysis", pipelineId);

            JsonNode payload = event.path("payload");
            Map<String, Object> buildResult = objectMapper.convertValue(payload,
                    new TypeReference<Map<String, Object>>() {});

            // Check Redis for similar historical failures
            String errorMessage = (String) buildResult.getOrDefault("errorMessage", "");
            String fingerprint = computeFingerprint(errorMessage);
            String cachedAnalysis = redisTemplate.opsForValue().get("failure:fingerprint:" + fingerprint);

            AnalysisResult analysis;
            if (cachedAnalysis != null) {
                log.info("Found cached analysis for fingerprint {}", fingerprint);
                analysis = objectMapper.readValue(cachedAnalysis, AnalysisResult.class);
            } else {
                // Run AI analysis
                analysis = failureAnalyzer.analyze(buildResult, Map.of("pipelineId", pipelineId));

                // Cache the result
                try {
                    String cacheValue = objectMapper.writeValueAsString(analysis);
                    redisTemplate.opsForValue().set(
                            "failure:fingerprint:" + fingerprint, cacheValue, Duration.ofHours(24));
                } catch (Exception e) {
                    log.warn("Failed to cache analysis result: {}", e.getMessage());
                }
            }

            // Track failure frequency
            redisTemplate.opsForValue().increment("failure:count:" + analysis.getFailureType());

            // Add to recent failures sorted set
            redisTemplate.opsForZSet().add("recent-failures", pipelineId,
                    System.currentTimeMillis());
            // Trim to last 100 failures
            redisTemplate.opsForZSet().removeRange("recent-failures", 0, -101);

            // Build analysis event payload
            Map<String, Object> analysisPayload = new HashMap<>();
            analysisPayload.put("pipelineId", pipelineId);
            analysisPayload.put("failureType", analysis.getFailureType());
            analysisPayload.put("rootCause", analysis.getRootCause());
            analysisPayload.put("confidence", analysis.getConfidence());
            analysisPayload.put("affectedFiles", analysis.getAffectedFiles());
            analysisPayload.put("explanation", analysis.getExplanation());
            analysisPayload.put("suggestedFix", analysis.getSuggestedFix());
            analysisPayload.put("severity", analysis.getSeverity());
            analysisPayload.put("fingerprint", fingerprint);
            analysisPayload.put("buildLog", buildResult.get("buildLog"));
            analysisPayload.put("repository", buildResult.get("repository"));
            analysisPayload.put("commitSha", buildResult.get("commitSha"));
            analysisPayload.put("branch", buildResult.get("branch"));

            CicdEvent analysisEvent = CicdEvent.create("AI_ANALYSIS_COMPLETED", "ai-analyzer", analysisPayload);
            analysisEvent.setPipelineId(pipelineId);
            eventPublisher.publish(AI_ANALYSIS_TOPIC, analysisEvent);

            log.info("AI analysis completed for pipeline {}: type={}, confidence={}, severity={}",
                    pipelineId, analysis.getFailureType(), analysis.getConfidence(), analysis.getSeverity());

        } catch (Exception e) {
            log.error("Error processing build event: {}", e.getMessage(), e);
        }
    }

    private String computeFingerprint(String errorMessage) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(errorMessage.getBytes());
            return HexFormat.of().formatHex(hash).substring(0, 16);
        } catch (Exception e) {
            return String.valueOf(errorMessage.hashCode());
        }
    }
}
