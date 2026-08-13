package com.cicdai.analyzer.service;

import com.cicdai.analyzer.dto.AnalysisResult;

import java.util.Map;

/**
 * Interface for failure analysis. Implementations include:
 * - MockAnalyzer: Returns realistic canned analysis (default)
 * - LlmAnalyzer: Calls an actual LLM API (when API key is provided)
 */
public interface FailureAnalyzer {

    AnalysisResult analyze(Map<String, Object> buildResult, Map<String, Object> context);
}
