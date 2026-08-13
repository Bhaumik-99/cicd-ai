package com.demo.payment;

/**
 * PaymentService processes payments through a PaymentGateway.
 *
 * BUG SCENARIO: When the @Autowired annotation is removed (simulated),
 * the paymentGateway field remains null, causing NullPointerException
 * in processPayment() and refundPayment().
 */
public class PaymentService {

    // In the "buggy" version, this field is not injected (null)
    private PaymentGateway paymentGateway;

    // Working constructor — used when DI is properly configured
    public PaymentService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    // Buggy constructor — simulates removed @Autowired
    public PaymentService() {
        // paymentGateway remains null!
    }

    public boolean processPayment(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        // This line throws NPE if paymentGateway is null
        return paymentGateway.charge(amount);
    }

    public boolean refundPayment(String transactionId) {
        if (transactionId == null || transactionId.isEmpty()) {
            throw new IllegalArgumentException("Transaction ID is required");
        }
        // This line throws NPE if paymentGateway is null
        return paymentGateway.refund(transactionId);
    }

    public boolean validatePayment(double amount) {
        return amount > 0 && amount <= 10000;
    }

    public double calculateFee(double amount) {
        return amount * 0.029 + 0.30; // Stripe-like fee
    }
}
