package com.cicdai.pipeline.consumer;

import com.cicdai.pipeline.service.PipelineService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
public class EventConsumer {

    private static final Logger log = LoggerFactory.getLogger(EventConsumer.class);

    private final PipelineService pipelineService;
    private final ObjectMapper objectMapper;

    public EventConsumer(PipelineService pipelineService, ObjectMapper objectMapper) {
        this.pipelineService = pipelineService;
        this.objectMapper = objectMapper;
    }

    /**
     * Consume CODE_PUSHED events from webhook service → create pipeline.
     */
    @KafkaListener(topics = "code-events", groupId = "pipeline-service-group")
    public void handleCodeEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();

            if (!"CODE_PUSHED".equals(eventType)) {
                log.debug("Ignoring event type: {}", eventType);
                return;
            }

            log.info("Received CODE_PUSHED event: {}", event.path("eventId").asText());

            JsonNode payload = event.path("payload");
            java.util.Map<String, Object> payloadMap = objectMapper.convertValue(payload, 
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});

            pipelineService.createPipeline(payloadMap);
        } catch (Exception e) {
            log.error("Error processing code event: {}", e.getMessage(), e);
        }
    }

    /**
     * Consume BUILD_SUCCEEDED and BUILD_FAILED events from build worker → update pipeline.
     */
    @KafkaListener(topics = "build-events", groupId = "pipeline-service-group")
    public void handleBuildEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();
            String pipelineId = event.path("pipelineId").asText();

            if (pipelineId == null || pipelineId.isEmpty()) {
                pipelineId = event.path("payload").path("pipelineId").asText();
            }

            log.info("Received {} event for pipeline {}", eventType, pipelineId);

            JsonNode payload = event.path("payload");
            String buildLog = payload.path("buildLog").asText(null);
            String testResults = payload.path("testResults").asText(null);
            String errorMessage = payload.path("errorMessage").asText(null);

            pipelineService.updateFromBuildResult(pipelineId, eventType, buildLog, testResults, errorMessage);

            // If build failed, transition to ANALYZING (AI analyzer will pick it up)
            if ("BUILD_FAILED".equals(eventType)) {
                pipelineService.transitionToAnalyzing(pipelineId);
            }
        } catch (Exception e) {
            log.error("Error processing build event: {}", e.getMessage(), e);
        }
    }

    /**
     * Consume AI_ANALYSIS_COMPLETED events → transition pipeline to RESOLVED.
     */
    @KafkaListener(topics = "ai-analysis-events", groupId = "pipeline-service-group")
    public void handleAnalysisEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();

            if (!"AI_ANALYSIS_COMPLETED".equals(eventType)) return;

            String pipelineId = event.path("pipelineId").asText();
            if (pipelineId == null || pipelineId.isEmpty()) {
                pipelineId = event.path("payload").path("pipelineId").asText();
            }

            log.info("Received AI_ANALYSIS_COMPLETED for pipeline {}", pipelineId);
            pipelineService.transitionToResolved(pipelineId);
        } catch (Exception e) {
            log.error("Error processing analysis event: {}", e.getMessage(), e);
        }
    }
}
