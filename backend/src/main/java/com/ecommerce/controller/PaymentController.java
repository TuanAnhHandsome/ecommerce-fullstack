// FILE: controller/PaymentController.java  ← THE CRITICAL FILE
// ================================================================
package com.ecommerce.controller;

import com.ecommerce.dto.request.CreatePaymentRequest;
import com.ecommerce.dto.response.CreatePaymentResponse;
import com.ecommerce.payment.vnpay.VNPayService;
import com.ecommerce.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final VNPayService vnPayService;
    private final OrderService orderService;

    /**
     * STEP 2: Frontend gọi API này sau khi user click "Thanh toán"
     * POST /api/payment/create-payment
     * Body: { orderId: 123 }
     * Returns: { paymentUrl: "https://sandbox.vnpayment.vn/..." }
     */
    @PostMapping("/create-payment")
    public ResponseEntity<CreatePaymentResponse> createPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreatePaymentRequest request,
            HttpServletRequest httpRequest) {

        // Lấy order và verify quyền sở hữu
        var order = orderService.getOrderEntityForPayment(
                userDetails.getUsername(), request.getOrderId());

        // Tạo VNPay payment URL
        String paymentUrl = vnPayService.createPaymentUrl(order, httpRequest);

        log.info("Payment URL created for order: {}", order.getOrderCode());

        return ResponseEntity.ok(CreatePaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .orderCode(order.getOrderCode())
                .amount(order.getFinalAmount())
                .build());
    }

    /**
     * STEP 6: VNPay redirect user về đây sau khi thanh toán
     * GET /api/payment/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=...
     *
     * ⚠️ Chỉ dùng để verify & redirect về frontend
     * KHÔNG cập nhật DB ở đây (dùng IPN thay thế)
     */
    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {

        // Tạo mutable copy vì verifyReturnUrl() sẽ remove keys
        Map<String, String> mutableParams = new java.util.HashMap<>(params);

        boolean isValid = vnPayService.verifyReturnUrl(mutableParams);
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");

        String frontend = "http://localhost:5173";

        String redirectUrl;
        if (!isValid) {
            redirectUrl = frontend + "/payment/result?status=invalid&txnRef=" + txnRef;
        } else if ("00".equals(responseCode)) {
            redirectUrl = frontend + "/payment/result?status=success&txnRef=" + txnRef;
        } else {
            redirectUrl = frontend + "/payment/result?status=failed&txnRef=" + txnRef;
        }

        return ResponseEntity.status(302)
                .header("Location", redirectUrl)
                .header("ngrok-skip-browser-warning", "true") // ← bypass warning page
                .build();
    }

    /**
     * STEP 8: VNPay gọi IPN (Instant Payment Notification) về đây
     * Đây là server-to-server webhook — KHÔNG cần auth
     * Đây là nơi DUY NHẤT nên cập nhật trạng thái đơn hàng
     *
     * POST /api/payment/vnpay-ipn
     * (VNPay thực ra gọi GET với query params)
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIPN(
            @RequestParam Map<String, String> params) {

        log.info("VNPay IPN received: txnRef={}, responseCode={}",
                params.get("vnp_TxnRef"), params.get("vnp_ResponseCode"));

        // Tạo mutable copy vì processIPN sẽ remove keys
        Map<String, String> mutableParams = new java.util.HashMap<>(params);
        Map<String, String> result = vnPayService.processIPN(mutableParams);

        // VNPay expects response: {"RspCode":"00","Message":"Confirm success"}
        return ResponseEntity.ok(result);
    }
}