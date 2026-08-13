package com.cicdai.worker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Simulates build and test execution for the demo.
 * 
 * Instead of running actual Docker containers (which adds significant complexity),
 * this service simulates realistic build/test output including:
 * - Build compilation logs
 * - Test execution results
 * - Intentional failures when injectBug=true
 * 
 * This approach is safer for MVP and demonstrates the full event-driven flow.
 */
@Service
public class BuildExecutor {

    private static final Logger log = LoggerFactory.getLogger(BuildExecutor.class);

    /**
     * Execute a simulated build and test run.
     *
     * @param repository  the repository name
     * @param commitSha   the commit SHA
     * @param branch      the branch name
     * @param injectBug   whether to simulate a test failure
     * @return build result containing logs, test results, and exit code
     */
    public Map<String, Object> executeBuild(String repository, String commitSha, 
                                             String branch, boolean injectBug) {
        log.info("Starting build for {}/{} (commit: {}, injectBug: {})", 
                repository, branch, commitSha, injectBug);
        
        long startTime = System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();

        // Simulate build time (1-3 seconds)
        try {
            Thread.sleep(1500 + (long)(Math.random() * 1500));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        StringBuilder buildLog = new StringBuilder();
        buildLog.append("[").append(Instant.now()).append("] Starting build...\n");
        buildLog.append("[INFO] Scanning for projects...\n");
        buildLog.append("[INFO] --- maven-compiler-plugin:3.11.0:compile ---\n");
        buildLog.append("[INFO] Compiling 5 source files to /target/classes\n");

        if (injectBug) {
            // Simulate a test failure — NullPointerException in PaymentService
            buildLog.append("[INFO] --- maven-surefire-plugin:3.1.2:test ---\n");
            buildLog.append("[INFO] Running com.demo.payment.PaymentServiceTest\n");
            buildLog.append("[ERROR] Tests run: 4, Failures: 1, Errors: 1, Skipped: 0\n");
            buildLog.append("\n");
            buildLog.append("-------------------------------------------------------\n");
            buildLog.append(" T E S T S\n");
            buildLog.append("-------------------------------------------------------\n");
            buildLog.append("[ERROR] PaymentServiceTest.testProcessPayment:42\n");
            buildLog.append("  java.lang.NullPointerException: Cannot invoke \"com.demo.payment.PaymentGateway.charge(double)\"");
            buildLog.append(" because \"this.paymentGateway\" is null\n");
            buildLog.append("    at com.demo.payment.PaymentService.processPayment(PaymentService.java:28)\n");
            buildLog.append("    at com.demo.payment.PaymentServiceTest.testProcessPayment(PaymentServiceTest.java:42)\n");
            buildLog.append("\n");
            buildLog.append("[ERROR] PaymentServiceTest.testRefundPayment:58\n");
            buildLog.append("  java.lang.NullPointerException: Cannot invoke \"com.demo.payment.PaymentGateway.refund(String)\"");
            buildLog.append(" because \"this.paymentGateway\" is null\n");
            buildLog.append("    at com.demo.payment.PaymentService.refundPayment(PaymentService.java:45)\n");
            buildLog.append("    at com.demo.payment.PaymentServiceTest.testRefundPayment(PaymentServiceTest.java:58)\n");
            buildLog.append("\n");
            buildLog.append("[INFO] Results:\n");
            buildLog.append("[INFO] Tests run: 4, Failures: 1, Errors: 1, Skipped: 0\n");
            buildLog.append("[INFO] BUILD FAILURE\n");
            buildLog.append("[INFO] Total time: 3.2s\n");

            result.put("success", false);
            result.put("exitCode", 1);
            result.put("buildLog", buildLog.toString());
            result.put("errorMessage", "java.lang.NullPointerException: Cannot invoke \"com.demo.payment.PaymentGateway.charge(double)\" because \"this.paymentGateway\" is null");
            result.put("testResults", "Tests run: 4, Failures: 1, Errors: 1, Skipped: 0");
            result.put("failedTests", List.of(
                    "PaymentServiceTest.testProcessPayment",
                    "PaymentServiceTest.testRefundPayment"
            ));
            result.put("stdout", buildLog.toString());
            result.put("stderr", "NullPointerException in PaymentService.processPayment");

        } else {
            // Simulate a successful build
            buildLog.append("[INFO] --- maven-surefire-plugin:3.1.2:test ---\n");
            buildLog.append("[INFO] Running com.demo.payment.PaymentServiceTest\n");
            buildLog.append("[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0\n");
            buildLog.append("[INFO] Running com.demo.order.OrderServiceTest\n");
            buildLog.append("[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0\n");
            buildLog.append("\n");
            buildLog.append("[INFO] Results:\n");
            buildLog.append("[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0\n");
            buildLog.append("[INFO] BUILD SUCCESS\n");
            buildLog.append("[INFO] Total time: 2.8s\n");

            result.put("success", true);
            result.put("exitCode", 0);
            result.put("buildLog", buildLog.toString());
            result.put("errorMessage", null);
            result.put("testResults", "Tests run: 7, Failures: 0, Errors: 0, Skipped: 0");
            result.put("failedTests", List.of());
            result.put("stdout", buildLog.toString());
            result.put("stderr", "");
        }

        long duration = System.currentTimeMillis() - startTime;
        result.put("durationMs", duration);
        result.put("repository", repository);
        result.put("commitSha", commitSha);
        result.put("branch", branch);

        log.info("Build completed for {}/{}: success={}, duration={}ms",
                repository, branch, result.get("success"), duration);

        return result;
    }
}
