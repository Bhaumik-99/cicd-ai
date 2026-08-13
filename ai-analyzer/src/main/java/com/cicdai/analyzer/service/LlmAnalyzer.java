package com.cicdai.analyzer.service;

import com.cicdai.analyzer.dto.AnalysisResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * Real LLM-based failure analyzer. Calls an OpenAI-compatible API
 * to analyze build failures and generate root cause analysis.
 */
public class LlmAnalyzer implements FailureAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(LlmAnalyzer.class);

    private final WebClient webClient;
    private final String model;
    private final ObjectMapper objectMapper;

    public LlmAnalyzer(String apiUrl, String apiKey, String model) {
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
        this.model = model;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public AnalysisResult analyze(Map<String, Object> buildResult, Map<String, Object> context) {
        log.info("Using LLM analyzer (model: {})", model);

        try {
            String buildLog = (String) buildResult.getOrDefault("buildLog", "No logs available");
            String errorMessage = (String) buildResult.getOrDefault("errorMessage", "Unknown");
            String repository = (String) buildResult.getOrDefault("repository", "unknown");

            String prompt = buildPrompt(buildLog, errorMessage, repository);

            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", getSystemPrompt()),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.3,
                    "max_tokens", 1500
            ));

            String response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseResponse(response);

        } catch (Exception e) {
            log.error("LLM analysis failed, falling back to mock: {}", e.getMessage());
            return new MockAnalyzer().analyze(buildResult, context);
        }
    }

    private String getSystemPrompt() {
        return """
                You are a CI/CD failure analysis expert. When given build/test logs, analyze the root cause
                and provide a structured JSON response with these fields:
                - failureType: One of TEST_FAILURE, COMPILATION_ERROR, DEPENDENCY_ERROR, CONFIGURATION_ERROR, RUNTIME_ERROR
                - rootCause: A clear explanation of what caused the failure
                - confidence: A number between 0.0 and 1.0 indicating your confidence
                - affectedFiles: Array of file paths that are likely causing the issue
                - explanation: Detailed technical explanation of the failure
                - suggestedFix: Specific code changes or configuration updates to fix the issue
                - severity: One of LOW, MEDIUM, HIGH, CRITICAL
                
                Respond ONLY with valid JSON. Do not include markdown formatting.
                """;
    }

    private String buildPrompt(String buildLog, String errorMessage, String repository) {
        return String.format("""
                Analyze this CI/CD build failure:
                
                Repository: %s
                Error: %s
                
                Build Log:
                ```
                %s
                ```
                
                Provide your analysis as JSON.
                """, repository, errorMessage, buildLog);
    }

    private AnalysisResult parseResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String content = root.path("choices").path(0).path("message").path("content").asText();

            // Clean up response — remove markdown code fences if present
            content = content.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

            return objectMapper.readValue(content, AnalysisResult.class);
        } catch (Exception e) {
            log.error("Failed to parse LLM response: {}", e.getMessage());
            AnalysisResult fallback = new AnalysisResult();
            fallback.setFailureType("UNKNOWN_FAILURE");
            fallback.setRootCause("LLM response could not be parsed");
            fallback.setConfidence(0.5);
            fallback.setAffectedFiles(List.of("unknown"));
            fallback.setExplanation("The LLM response could not be parsed into a structured format.");
            fallback.setSuggestedFix("Review build logs manually.");
            fallback.setSeverity("MEDIUM");
            return fallback;
        }
    }
}
