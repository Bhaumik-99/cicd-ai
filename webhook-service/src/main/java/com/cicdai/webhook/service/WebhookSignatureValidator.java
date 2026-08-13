package com.cicdai.webhook.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class WebhookSignatureValidator {

    private static final Logger log = LoggerFactory.getLogger(WebhookSignatureValidator.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    @Value("${github.webhook.secret:your-webhook-secret-here}")
    private String webhookSecret;

    /**
     * Validates GitHub webhook signature (X-Hub-Signature-256 header).
     * Returns true if signature is valid or if secret is not configured.
     */
    public boolean validate(String signature, String body) {
        if (webhookSecret == null || webhookSecret.equals("your-webhook-secret-here")) {
            log.warn("Webhook secret not configured, skipping signature validation");
            return true;
        }

        if (signature == null || !signature.startsWith("sha256=")) {
            log.warn("Missing or invalid signature format");
            return false;
        }

        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = "sha256=" + HexFormat.of().formatHex(hash);

            boolean valid = expectedSignature.equals(signature);
            if (!valid) {
                log.warn("Webhook signature validation failed");
            }
            return valid;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error validating webhook signature: {}", e.getMessage());
            return false;
        }
    }
}
