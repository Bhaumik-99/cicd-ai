package com.cicdai.failure.consumer;

import com.cicdai.failure.model.FailureAnalysis;
import com.cicdai.failure.model.FailureHistory;
import com.cicdai.failure.repository.FailureAnalysisRepository;
import com.cicdai.failure.repository.FailureHistoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class AnalysisEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(AnalysisEventConsumer.class);

    private final FailureAnalysisRepository analysisRepository;
    private final FailureHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    public AnalysisEventConsumer(FailureAnalysisRepository analysisRepository,
                                  FailureHistoryRepository historyRepository,
                                  ObjectMapper objectMapper) {
        this.analysisRepository = analysisRepository;
        this.historyRepository = historyRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "ai-analysis-events", groupId = "failure-service-group")
    public void handleAnalysisEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
            String eventType = event.path("eventType").asText();

            if (!"AI_ANALYSIS_COMPLETED".equals(eventType)) return;

            JsonNode payload = event.path("payload");
            String pipelineId = payload.path("pipelineId").asText();

            log.info("Storing failure analysis for pipeline {}", pipelineId);

            // Store FailureAnalysis
            FailureAnalysis analysis = new FailureAnalysis();
            analysis.setId(UUID.randomUUID());
            analysis.setPipelineId(UUID.fromString(pipelineId));
            analysis.setFailureType(payload.path("failureType").asText());
            analysis.setRootCause(payload.path("rootCause").asText());
            analysis.setConfidence(BigDecimal.valueOf(payload.path("confidence").asDouble(0.0)));
            analysis.setAffectedFiles(payload.path("affectedFiles").toString());
            analysis.setExplanation(payload.path("explanation").asText());
            analysis.setSuggestedFix(payload.path("suggestedFix").asText());
            analysis.setSeverity(payload.path("severity").asText());
            analysis.setBuildLog(payload.path("buildLog").asText());
            analysis.setCommitSha(payload.path("commitSha").asText());
            analysis.setRepository(payload.path("repository").asText());
            analysis.setBranch(payload.path("branch").asText());

            analysisRepository.save(analysis);

            // Store FailureHistory
            FailureHistory history = new FailureHistory();
            history.setId(UUID.randomUUID());
            history.setPipelineId(UUID.fromString(pipelineId));
            history.setRepository(payload.path("repository").asText());
            history.setFailureFingerprint(payload.path("fingerprint").asText());
            history.setFailureType(payload.path("failureType").asText());
            history.setRootCause(payload.path("rootCause").asText());
            history.setSeverity(payload.path("severity").asText());
            history.setResolved(false);

            historyRepository.save(history);

            log.info("Stored failure analysis and history for pipeline {}", pipelineId);

        } catch (Exception e) {
            log.error("Error processing analysis event: {}", e.getMessage(), e);
        }
    }
}
