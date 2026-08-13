package com.cicdai.webhook.controller;

import com.cicdai.webhook.dto.CicdEvent;
import com.cicdai.webhook.dto.GitHubPushPayload;
import com.cicdai.webhook.dto.SimulateRequest;
import com.cicdai.webhook.service.EventPublisher;
import com.cicdai.webhook.service.WebhookSignatureValidator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private static final String CODE_EVENTS_TOPIC = "code-events";

    private final EventPublisher eventPublisher;
    private final WebhookSignatureValidator signatureValidator;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public WebhookController(EventPublisher eventPublisher,
                             WebhookSignatureValidator signatureValidator,
                             StringRedisTemplate redisTemplate,
                             ObjectMapper objectMapper) {
        this.eventPublisher = eventPublisher;
        this.signatureValidator = signatureValidator;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Receive real GitHub webhook push events.
     */
    @PostMapping("/github")
    public ResponseEntity<Map<String, Object>> handleGitHubWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "X-GitHub-Event", required = false) String eventType,
            @RequestBody String body) {

        log.info("Received GitHub webhook event: {}", eventType);

        // Validate signature
        if (!signatureValidator.validate(signature, body)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
        }

        // Only process push events
        if (!"push".equals(eventType)) {
            log.info("Ignoring non-push event: {}", eventType);
            return ResponseEntity.ok(Map.of("status", "ignored", "reason", "Not a push event"));
        }

        try {
            JsonNode json = objectMapper.readTree(body);
            GitHubPushPayload payload = new GitHubPushPayload();
            payload.setRepository(json.path("repository").path("full_name").asText("unknown"));
            payload.setBranch(json.path("ref").asText("refs/heads/main").replace("refs/heads/", ""));
            payload.setCommitSha(json.path("after").asText("unknown"));

            JsonNode pusher = json.path("pusher");
            payload.setAuthor(pusher.path("name").asText("unknown"));

            JsonNode headCommit = json.path("head_commit");
            payload.setCommitMessage(headCommit.path("message").asText(""));

            return publishCodePushedEvent(payload, false);
        } catch (Exception e) {
            log.error("Error processing GitHub webhook: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Simulate a GitHub push event for demo/testing purposes.
     */
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulateWebhook(@RequestBody SimulateRequest request) {
        log.info("Simulating webhook for repository: {}", request.getRepository());

        GitHubPushPayload payload = new GitHubPushPayload();
        payload.setRepository(request.getRepository() != null ? request.getRepository() : "demo-repo");
        payload.setBranch(request.getBranch() != null ? request.getBranch() : "main");
        payload.setCommitSha(request.getCommitSha() != null ? request.getCommitSha() : UUID.randomUUID().toString().substring(0, 7));
        payload.setAuthor(request.getAuthor() != null ? request.getAuthor() : "developer");
        payload.setCommitMessage(request.getCommitMessage() != null ? request.getCommitMessage() : "Update PaymentService");

        return publishCodePushedEvent(payload, request.isInjectBug());
    }

    private ResponseEntity<Map<String, Object>> publishCodePushedEvent(GitHubPushPayload payload, boolean injectBug) {
        // Idempotency check — deduplicate by commit SHA
        String dedupeKey = "webhook:dedup:" + payload.getRepository() + ":" + payload.getCommitSha();
        Boolean isNew = redisTemplate.opsForValue().setIfAbsent(dedupeKey, "1", Duration.ofMinutes(10));

        if (Boolean.FALSE.equals(isNew)) {
            log.warn("Duplicate webhook event for commit {}, skipping", payload.getCommitSha());
            return ResponseEntity.ok(Map.of("status", "duplicate", "commitSha", payload.getCommitSha()));
        }

        // Build event payload
        Map<String, Object> eventPayload = new HashMap<>();
        eventPayload.put("repository", payload.getRepository());
        eventPayload.put("branch", payload.getBranch());
        eventPayload.put("commitSha", payload.getCommitSha());
        eventPayload.put("author", payload.getAuthor());
        eventPayload.put("commitMessage", payload.getCommitMessage());
        eventPayload.put("injectBug", injectBug);

        CicdEvent event = CicdEvent.create("CODE_PUSHED", "webhook-service", eventPayload);

        eventPublisher.publish(CODE_EVENTS_TOPIC, event);

        log.info("Published CODE_PUSHED event for {}/{} (commit: {})",
                payload.getRepository(), payload.getBranch(), payload.getCommitSha());

        Map<String, Object> response = new HashMap<>();
        response.put("status", "accepted");
        response.put("eventId", event.getEventId());
        response.put("commitSha", payload.getCommitSha());
        response.put("repository", payload.getRepository());

        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "webhook-service"));
    }
}
