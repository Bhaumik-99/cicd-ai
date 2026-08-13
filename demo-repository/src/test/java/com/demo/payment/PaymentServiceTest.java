package com.demo.payment;

import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Tests for PaymentService.
 * When PaymentService is created with the buggy no-arg constructor,
 * testProcessPayment and testRefundPayment will fail with NullPointerException.
 */
public class PaymentServiceTest {

    @Test
    public void testProcessPayment() {
        // BUG: Using no-arg constructor — paymentGateway is null
        PaymentService service = new PaymentService();
        // This will throw NullPointerException
        service.processPayment(100.0);
    }

    @Test
    public void testRefundPayment() {
        PaymentService service = new PaymentService();
        // This will throw NullPointerException
        service.refundPayment("txn_123");
    }

    @Test
    public void testValidatePayment() {
        PaymentService service = new PaymentService();
        assertTrue(service.validatePayment(50.0));
        assertFalse(service.validatePayment(-10.0));
        assertFalse(service.validatePayment(20000.0));
    }

    @Test
    public void testCalculateFee() {
        PaymentService service = new PaymentService();
        double fee = service.calculateFee(100.0);
        assertEquals(3.20, fee, 0.01);
    }
}
