package com.ecommerce.service.impl;

import com.ecommerce.entity.Order;
import com.ecommerce.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import jakarta.mail.internet.InternetAddress;

import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    private static final String FROM_EMAIL = "noreply@ecommerce.com";
    private static final String FROM_NAME = "EShop";

    @Override
    @Async
    public void sendOrderConfirmation(Order order) {
        try {
            Context ctx = buildBaseContext(order);
            String html = templateEngine.process("email/order-confirmation", ctx);
            sendEmail(
                    order.getUser().getEmail(),
                    "✅ Xác nhận đơn hàng #" + order.getOrderCode(),
                    html);
            log.info("Sent order confirmation email to {} for order {}",
                    order.getUser().getEmail(), order.getOrderCode());
        } catch (Exception e) {
            log.error("Failed to send order confirmation email for order {}: {}",
                    order.getOrderCode(), e.getMessage());
        }
    }

    @Override
    @Async
    public void sendOrderStatusUpdate(Order order) {
        try {
            Context ctx = buildBaseContext(order);
            String statusName = order.getStatus().name();
            ctx.setVariable("statusLabel", getStatusLabel(statusName));
            ctx.setVariable("statusMessage", getStatusMessage(statusName));
            ctx.setVariable("statusColor", getStatusColor(statusName));

            String html = templateEngine.process("email/order-status-update", ctx);
            sendEmail(
                    order.getUser().getEmail(),
                    "📦 Cập nhật đơn hàng #" + order.getOrderCode() + " — " + getStatusLabel(statusName),
                    html);
            log.info("Sent order status update email to {} for order {} — status {}",
                    order.getUser().getEmail(), order.getOrderCode(), order.getStatus());
        } catch (Exception e) {
            log.error("Failed to send order status update email for order {}: {}",
                    order.getOrderCode(), e.getMessage());
        }
    }

    @Override
    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            String html = """
                    <!DOCTYPE html>
                    <html lang="vi">
                    <head><meta charset="UTF-8"/></head>
                    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
                        <tr><td align="center">
                          <table width="480" cellpadding="0" cellspacing="0"
                                 style="background:#ffffff;border-radius:16px;overflow:hidden;
                                        box-shadow:0 4px 24px rgba(0,0,0,0.08)">
                            <!-- Header -->
                            <tr>
                              <td style="background:linear-gradient(135deg,#ef4444,#f97316);
                                         padding:32px;text-align:center">
                                <span style="font-size:28px;font-weight:700;color:#ffffff;
                                             letter-spacing:-0.5px">EShop</span>
                              </td>
                            </tr>
                            <!-- Body -->
                            <tr>
                              <td style="padding:40px 40px 32px">
                                <h2 style="margin:0 0 8px;font-size:22px;color:#1f2937">
                                  🔐 Xác thực tài khoản
                                </h2>
                                <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6">
                                  Cảm ơn bạn đã đăng ký EShop! Vui lòng dùng mã OTP bên dưới
                                  để hoàn tất đăng ký. Mã có hiệu lực trong <strong>5 phút</strong>.
                                </p>
                                <!-- OTP Box -->
                                <div style="background:#fef2f2;border:2px dashed #fca5a5;
                                            border-radius:12px;text-align:center;padding:28px 0;
                                            margin-bottom:28px">
                                  <span style="font-size:42px;font-weight:700;
                                               letter-spacing:16px;color:#ef4444;
                                               font-family:'Courier New',monospace">%s</span>
                                </div>
                                <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5">
                                  Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.
                                  Tài khoản sẽ không được tạo nếu mã không được xác nhận.
                                </p>
                              </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                              <td style="background:#f9fafb;padding:20px 40px;
                                         border-top:1px solid #f3f4f6;text-align:center">
                                <p style="margin:0;font-size:12px;color:#9ca3af">
                                  © 2025 EShop · Email này được gửi tự động, vui lòng không trả lời.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td></tr>
                      </table>
                    </body>
                    </html>
                    """.formatted(otp);

            sendEmail(toEmail, "🔐 Mã OTP xác thực tài khoản EShop — " + otp, html);
            log.info("Sent OTP email to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private void sendEmail(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        try {
            helper.setFrom(new InternetAddress(FROM_EMAIL, FROM_NAME, "UTF-8"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to set email sender", e);
        }
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    private Context buildBaseContext(Order order) {
        NumberFormat vndFormat = NumberFormat.getInstance(new Locale("vi", "VN"));
        Context ctx = new Context(new Locale("vi", "VN"));
        ctx.setVariable("order", order);
        ctx.setVariable("customerName", order.getShippingName());
        ctx.setVariable("orderCode", order.getOrderCode());
        ctx.setVariable("orderItems", order.getOrderItems());
        ctx.setVariable("shippingName", order.getShippingName());
        ctx.setVariable("shippingPhone", order.getShippingPhone());
        ctx.setVariable("shippingAddress", order.getShippingAddress());
        ctx.setVariable("note", order.getNote());
        ctx.setVariable("totalAmount", vndFormat.format(order.getTotalAmount()) + "₫");
        ctx.setVariable("shippingFee",
                order.getShippingFee().compareTo(java.math.BigDecimal.ZERO) == 0
                        ? "Miễn phí"
                        : vndFormat.format(order.getShippingFee()) + "₫");
        ctx.setVariable("finalAmount", vndFormat.format(order.getFinalAmount()) + "₫");
        ctx.setVariable("status", order.getStatus().name());
        ctx.setVariable("statusLabel", getStatusLabel(order.getStatus().name()));
        return ctx;
    }

    private String getStatusLabel(String status) {
        return switch (status) {
            case "PENDING"          -> "Chờ xử lý";
            case "AWAITING_PAYMENT" -> "Chờ thanh toán";
            case "PAID"             -> "Đã thanh toán";
            case "PROCESSING"       -> "Đang xử lý";
            case "SHIPPED"          -> "Đang giao hàng";
            case "DELIVERED"        -> "Đã giao hàng";
            case "CANCELLED"        -> "Đã hủy";
            case "REFUNDED"         -> "Đã hoàn tiền";
            default                 -> status;
        };
    }

    private String getStatusMessage(String status) {
        return switch (status) {
            case "PAID"       -> "Thanh toán thành công! Đơn hàng đang được xử lý.";
            case "PROCESSING" -> "Đơn hàng đang được xử lý. Chúng tôi sẽ sớm giao hàng.";
            case "SHIPPED"    -> "Đơn hàng đang trên đường giao đến bạn. Vui lòng để ý điện thoại!";
            case "DELIVERED"  -> "Đơn hàng đã giao thành công. Cảm ơn bạn đã mua hàng! 🎉";
            case "CANCELLED"  -> "Đơn hàng đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ.";
            case "REFUNDED"   -> "Hoàn tiền đã được xử lý. Vui lòng kiểm tra tài khoản trong 3-5 ngày làm việc.";
            default           -> "Trạng thái đơn hàng đã được cập nhật.";
        };
    }

    private String getStatusColor(String status) {
        return switch (status) {
            case "PAID", "DELIVERED" -> "#16a34a";
            case "SHIPPED"           -> "#2563eb";
            case "CANCELLED"         -> "#dc2626";
            case "REFUNDED"          -> "#9333ea";
            default                  -> "#d97706";
        };
    }
}