package com.demo.payment;

/**
 * Payment gateway interface for processing charges and refunds.
 */
public interface PaymentGateway {

    boolean charge(double amount);

    boolean refund(String transactionId);
}
