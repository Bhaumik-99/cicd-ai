package com.cicdai.analyzer.config;

import com.cicdai.analyzer.service.FailureAnalyzer;
import com.cicdai.analyzer.service.LlmAnalyzer;
import com.cicdai.analyzer.service.MockAnalyzer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AnalyzerConfig {

    private static final Logger log = LoggerFactory.getLogger(AnalyzerConfig.class);

    @Value("${llm.api.key:}")
    private String apiKey;

    @Value("${llm.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${llm.model:gpt-4o-mini}")
    private String model;

    @Bean
    public FailureAnalyzer failureAnalyzer() {
        if (apiKey != null && !apiKey.isBlank()) {
            log.info("LLM API key detected — using real LLM analyzer (model: {})", model);
            return new LlmAnalyzer(apiUrl, apiKey, model);
        } else {
            log.info("No LLM API key configured — using mock analyzer");
            return new MockAnalyzer();
        }
    }
}
