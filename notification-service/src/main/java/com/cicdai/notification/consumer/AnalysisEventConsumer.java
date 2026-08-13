package com.cicdai.notification.consumer;

import com.cicdai.notification.model.Notification;
import com.cicdai.notification.repository.NotificationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class AnalysisEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(AnalysisEventConsumer.class);

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public AnalysisEventConsumer(NotificationRepository notificationRepository,
                                  SimpMessagingTemplate messagingTemplate,
                                  ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "ai-analysis-events", groupId = "notification-service-group")
    public void handleAnalysisEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();

            if (!"AI_ANALYSIS_COMPLETED".equals(eventType)) return;

            JsonNode payload = event.path("payload");
            String pipelineId = payload.path("pipelineId").asText();
            String repository = payload.path("repository").asText("unknown");
            String failureType = payload.path("failureType").asText("UNKNOWN");
            String rootCause = payload.path("rootCause").asText("");
            String severity = payload.path("severity").asText("MEDIUM");
            double confidence = payload.path("confidence").asDouble(0.0);
            String suggestedFix = payload.path("suggestedFix").asText("");

            // Create notification
            String title = String.format("🔴 Build Failed: %s — %s (%.0f%% confidence)",
                    repository, failureType, confidence * 100);
            String notificationMessage = String.format(
                    "Root Cause: %s\n\nSeverity: %s\n\nSuggested Fix: %s",
                    rootCause.length() > 200 ? rootCause.substring(0, 200) + "..." : rootCause,
                    severity,
                    suggestedFix.length() > 300 ? suggestedFix.substring(0, 300) + "..." : suggestedFix);

            Notification notification = new Notification();
            notification.setId(UUID.randomUUID());
            notification.setPipelineId(UUID.fromString(pipelineId));
            notification.setType("AI_ANALYSIS");
            notification.setTitle(title);
            notification.setMessage(notificationMessage);
            notification.setSeverity(severity);
            notification.setRead(false);
            notification.setMetadata(payload.toString());
            notification.setCreatedAt(java.time.Instant.now());

            notification = notificationRepository.save(notification);
            log.info("Created notification for pipeline {} (severity: {})", pipelineId, severity);

            // Push via WebSocket
            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("id", notification.getId().toString());
            wsPayload.put("pipelineId", pipelineId);
            wsPayload.put("type", "AI_ANALYSIS");
            wsPayload.put("title", title);
            wsPayload.put("message", notificationMessage);
            wsPayload.put("severity", severity);
            wsPayload.put("createdAt", notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : java.time.Instant.now().toString());
            wsPayload.put("repository", repository);
            wsPayload.put("failureType", failureType);
            wsPayload.put("confidence", confidence);

            messagingTemplate.convertAndSend("/topic/notifications", wsPayload);
            log.info("Pushed notification via WebSocket for pipeline {}", pipelineId);

        } catch (Exception e) {
            log.error("Error processing analysis event: {}", e.getMessage(), e);
        }
    }
}
