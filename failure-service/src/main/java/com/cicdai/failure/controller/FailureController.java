package com.cicdai.failure.controller;

import com.cicdai.failure.model.FailureAnalysis;
import com.cicdai.failure.model.FailureHistory;
import com.cicdai.failure.repository.FailureAnalysisRepository;
import com.cicdai.failure.repository.FailureHistoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/failures")
public class FailureController {

    private final FailureAnalysisRepository analysisRepository;
    private final FailureHistoryRepository historyRepository;

    public FailureController(FailureAnalysisRepository analysisRepository,
                              FailureHistoryRepository historyRepository) {
        this.analysisRepository = analysisRepository;
        this.historyRepository = historyRepository;
    }

    @GetMapping
    public ResponseEntity<List<FailureAnalysis>> getAllFailures(
            @RequestParam(required = false) String repository,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String failureType) {

        List<FailureAnalysis> results;
        if (repository != null) {
            results = analysisRepository.findByRepositoryOrderByCreatedAtDesc(repository);
        } else if (severity != null) {
            results = analysisRepository.findBySeverityOrderByCreatedAtDesc(severity);
        } else if (failureType != null) {
            results = analysisRepository.findByFailureTypeOrderByCreatedAtDesc(failureType);
        } else {
            results = analysisRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FailureAnalysis> getFailure(@PathVariable UUID id) {
        return analysisRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pipeline/{pipelineId}")
    public ResponseEntity<FailureAnalysis> getByPipelineId(@PathVariable UUID pipelineId) {
        return analysisRepository.findByPipelineId(pipelineId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/similar/{fingerprint}")
    public ResponseEntity<List<FailureHistory>> getSimilarFailures(@PathVariable String fingerprint) {
        return ResponseEntity.ok(
                historyRepository.findByFailureFingerprintOrderByCreatedAtDesc(fingerprint));
    }

    @GetMapping("/history")
    public ResponseEntity<List<FailureHistory>> getHistory(
            @RequestParam(required = false) String repository) {
        if (repository != null) {
            return ResponseEntity.ok(historyRepository.findByRepositoryOrderByCreatedAtDesc(repository));
        }
        return ResponseEntity.ok(historyRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "failure-service"));
    }
}
