package com.cicdai.analyzer.service;

import com.cicdai.analyzer.dto.AnalysisResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * Mock AI analyzer that returns realistic analysis results without calling an LLM.
 * This is the default analyzer when no LLM API key is configured.
 * 
 * It parses the build log to extract the exception type and affected files,
 * then generates a plausible root cause analysis.
 */
public class MockAnalyzer implements FailureAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(MockAnalyzer.class);

    @Override
    public AnalysisResult analyze(Map<String, Object> buildResult, Map<String, Object> context) {
        log.info("Using mock AI analyzer (no LLM API key configured)");

        String buildLog = (String) buildResult.getOrDefault("buildLog", "");
        String errorMessage = (String) buildResult.getOrDefault("errorMessage", "Unknown error");

        AnalysisResult result = new AnalysisResult();

        // Detect failure patterns from build log
        if (buildLog.contains("NullPointerException")) {
            result.setFailureType("TEST_FAILURE");
            result.setRootCause("NullPointerException in PaymentService.processPayment() - " +
                    "The paymentGateway field is null because dependency injection was not properly configured. " +
                    "A recent code change likely removed the @Autowired annotation or the PaymentGateway bean definition, " +
                    "causing the field to remain uninitialized when processPayment() is called.");
            result.setConfidence(0.92);
            result.setAffectedFiles(List.of(
                    "src/main/java/com/demo/payment/PaymentService.java",
                    "src/main/java/com/demo/payment/PaymentGateway.java"
            ));
            result.setExplanation(
                    "The build log shows a NullPointerException at PaymentService.java:28 where " +
                    "this.paymentGateway.charge(double) is called. The paymentGateway field is null, " +
                    "indicating it was never injected. This commonly happens when:\n" +
                    "1. The @Autowired or @Inject annotation was accidentally removed\n" +
                    "2. The PaymentGateway class is no longer a Spring-managed bean\n" +
                    "3. Constructor injection was refactored but the constructor parameter was omitted\n\n" +
                    "Two test methods fail: testProcessPayment and testRefundPayment, both attempting " +
                    "to use the null paymentGateway reference.");
            result.setSuggestedFix(
                    "Add the @Autowired annotation back to the paymentGateway field in PaymentService, " +
                    "or better yet, use constructor injection:\n\n" +
                    "```java\n" +
                    "@Service\n" +
                    "public class PaymentService {\n" +
                    "    private final PaymentGateway paymentGateway;\n\n" +
                    "    @Autowired\n" +
                    "    public PaymentService(PaymentGateway paymentGateway) {\n" +
                    "        this.paymentGateway = paymentGateway;\n" +
                    "    }\n" +
                    "}\n" +
                    "```\n\n" +
                    "Also ensure PaymentGateway is annotated with @Component or @Service.");
            result.setSeverity("HIGH");

        } else if (buildLog.contains("CompilationFailure") || buildLog.contains("cannot find symbol")) {
            result.setFailureType("COMPILATION_ERROR");
            result.setRootCause("Compilation failure due to missing symbol or import");
            result.setConfidence(0.88);
            result.setAffectedFiles(List.of("src/main/java/com/demo/payment/PaymentService.java"));
            result.setExplanation("The build failed during compilation. A referenced class or method does not exist.");
            result.setSuggestedFix("Check for missing imports, renamed classes, or deleted dependencies.");
            result.setSeverity("HIGH");

        } else {
            result.setFailureType("UNKNOWN_FAILURE");
            result.setRootCause("Build failed with error: " + errorMessage);
            result.setConfidence(0.65);
            result.setAffectedFiles(List.of("unknown"));
            result.setExplanation("The build failed but the specific failure pattern was not recognized. " +
                    "Manual investigation is recommended. Error: " + errorMessage);
            result.setSuggestedFix("Review the full build log for details and check recent code changes.");
            result.setSeverity("MEDIUM");
        }

        log.info("Mock analysis complete: type={}, confidence={}, severity={}",
                result.getFailureType(), result.getConfidence(), result.getSeverity());

        return result;
    }
}
