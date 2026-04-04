package com.ecommerce.payment.vnpay;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.Payment;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentGateway;
import com.ecommerce.enums.PaymentStatus;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {

    private final VNPayConfig vnPayConfig;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ObjectMapper objectMapper;

    /**
     * Tạo URL thanh toán VNPay
     * Theo đúng demo chính thức VNPay Java
     */
    public String createPaymentUrl(Order order, HttpServletRequest request) {
        long amount = order.getFinalAmount()
                          .multiply(BigDecimal.valueOf(100))
                          .longValue();

        String txnRef     = order.getOrderCode();
        String createDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String ipAddr     = getClientIpAddress(request);

        // TreeMap tự sort theo alphabet — VNPay yêu cầu
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version",    vnPayConfig.getVersion());
        vnpParams.put("vnp_Command",    vnPayConfig.getCommand());
        vnpParams.put("vnp_TmnCode",    vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount",     String.valueOf(amount));
        vnpParams.put("vnp_CurrCode",   vnPayConfig.getCurrCode());
        vnpParams.put("vnp_TxnRef",     txnRef);
        vnpParams.put("vnp_OrderInfo",  "Thanh toan don hang " + txnRef);
        vnpParams.put("vnp_OrderType",  vnPayConfig.getOrderType());
        vnpParams.put("vnp_Locale",     vnPayConfig.getLocale());
        vnpParams.put("vnp_ReturnUrl",  vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr",     ipAddr);
        vnpParams.put("vnp_CreateDate", createDate);

        // ✅ ĐÚNG THEO DEMO CHÍNH THỨC VNPAY:
        // hashData = key=URLEncode(value) — encode value bằng US_ASCII
        // query    = URLEncode(key)=URLEncode(value)
        StringBuilder hashData = new StringBuilder();
        StringBuilder query    = new StringBuilder();

        vnpParams.forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                String encodedValue = URLEncoder.encode(value, StandardCharsets.US_ASCII);

                if (hashData.length() > 0) hashData.append('&');
                hashData.append(key).append('=').append(encodedValue);

                if (query.length() > 0) query.append('&');
                query.append(URLEncoder.encode(key, StandardCharsets.US_ASCII))
                     .append('=').append(encodedValue);
            }
        });

        // Ký HMAC-SHA512
        String hashSecret = vnPayConfig.getHashSecret().trim();
        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        log.info("VNPay URL created for order: {}", txnRef);

        savePaymentRecord(order, txnRef, secureHash);

        return vnPayConfig.getPayUrl() + "?" + query;
    }

    /**
     * Xử lý IPN Webhook từ VNPay — server-to-server
     */
    @Transactional
    public Map<String, String> processIPN(Map<String, String> vnpParams) {
        Map<String, String> result = new HashMap<>();
        try {
            String vnpSecureHash = vnpParams.remove("vnp_SecureHash");
            vnpParams.remove("vnp_SecureHashType");

            // Verify chữ ký — cùng cách build với createPaymentUrl
            String signedData = buildHashData(vnpParams);
            String checkHash  = hmacSHA512(vnPayConfig.getHashSecret().trim(), signedData);

            log.info("IPN: txnRef={}, responseCode={}",
                vnpParams.get("vnp_TxnRef"), vnpParams.get("vnp_ResponseCode"));

            if (!checkHash.equalsIgnoreCase(vnpSecureHash)) {
                log.error("IPN sai chữ ký!");
                result.put("RspCode", "97");
                result.put("Message", "Invalid signature");
                return result;
            }

            String txnRef        = vnpParams.get("vnp_TxnRef");
            String responseCode  = vnpParams.get("vnp_ResponseCode");
            String transactionNo = vnpParams.get("vnp_TransactionNo");
            String bankCode      = vnpParams.get("vnp_BankCode");
            String payDate       = vnpParams.get("vnp_PayDate");
            long   vnpAmount     = Long.parseLong(vnpParams.get("vnp_Amount"));

            Order order = orderRepository.findByOrderCode(txnRef).orElse(null);
            if (order == null) {
                result.put("RspCode", "01");
                result.put("Message", "Order not found");
                return result;
            }

            long expectedAmount = order.getFinalAmount()
                .multiply(BigDecimal.valueOf(100)).longValue();
            if (vnpAmount != expectedAmount) {
                result.put("RspCode", "04");
                result.put("Message", "Invalid amount");
                return result;
            }

            if (order.getStatus() == OrderStatus.PAID) {
                result.put("RspCode", "02");
                result.put("Message", "Order already confirmed");
                return result;
            }

            if ("00".equals(responseCode)) {
                order.setStatus(OrderStatus.PAID);
                orderRepository.save(order);

                paymentRepository.findByOrder(order).ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setVnpTransactionNo(transactionNo);
                    payment.setVnpBankCode(bankCode);
                    payment.setVnpPayDate(payDate);
                    payment.setVnpResponseCode(responseCode);
                    payment.setVnpSecureHash(vnpSecureHash);
                    payment.setRawCallback(toJson(vnpParams));
                    payment.setPaidAt(java.time.LocalDateTime.now());
                    paymentRepository.save(payment);
                });

                log.info("✅ IPN: Thanh toán THÀNH CÔNG cho order {}", txnRef);
            } else {
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);

                paymentRepository.findByOrder(order).ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setVnpResponseCode(responseCode);
                    payment.setRawCallback(toJson(vnpParams));
                    paymentRepository.save(payment);
                });

                log.warn("IPN: Thanh toán THẤT BẠI, order={}, code={}", txnRef, responseCode);
            }

            result.put("RspCode", "00");
            result.put("Message", "Confirm success");

        } catch (Exception e) {
            log.error("IPN error: ", e);
            result.put("RspCode", "99");
            result.put("Message", "Internal error");
        }
        return result;
    }

    /**
     * Verify Return URL — chỉ để hiển thị kết quả cho user
     */
    public boolean verifyReturnUrl(Map<String, String> vnpParams) {
        String vnpSecureHash = vnpParams.remove("vnp_SecureHash");
        vnpParams.remove("vnp_SecureHashType");
        String signedData = buildHashData(vnpParams);
        String checkHash  = hmacSHA512(vnPayConfig.getHashSecret().trim(), signedData);
        return checkHash.equalsIgnoreCase(vnpSecureHash);
    }

    // ── Private helpers ──────────────────────────────────────────

    private void savePaymentRecord(Order order, String txnRef, String secureHash) {
        Payment payment = Payment.builder()
            .order(order)
            .gateway(PaymentGateway.VNPAY)
            .amount(order.getFinalAmount())
            .currency("VND")
            .status(PaymentStatus.PENDING)
            .vnpTxnRef(txnRef)
            .vnpSecureHash(secureHash)
            .build();
        paymentRepository.save(payment);
    }

    /**
     * ✅ Build hashData đúng chuẩn VNPay:
     * Sort params theo TreeMap, encode value bằng US_ASCII
     */
    private String buildHashData(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        new TreeMap<>(params).forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                if (sb.length() > 0) sb.append('&');
                sb.append(key).append('=')
                  .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
            }
        });
        return sb.toString();
    }

    public static String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cannot compute HMAC-SHA512", e);
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("Proxy-Client-IP");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();
        if (ip != null && ip.contains(","))
            ip = ip.split(",")[0].trim();
        // Fix IPv6 loopback → IPv4
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip))
            ip = "127.0.0.1";
        return ip != null ? ip : "127.0.0.1";
    }

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }
}