import { z } from 'zod'

/**
 * Schema validate thông tin giao hàng tại CheckoutPage.
 * Dùng zod thay vì chỉ dựa vào `required` của HTML, vì:
 *  - `required` không chặn được input dạng chỉ có khoảng trắng
 *  - `required` không validate được định dạng số điện thoại VN
 *  - Cần thông báo lỗi rõ ràng, nhất quán cho từng field
 */
export const shippingSchema = z.object({
  shippingName: z
    .string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên quá dài'),

  shippingPhone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(\d{9,10})$/, 'Số điện thoại không hợp lệ (vd: 0901234567)'),

  shippingAddress: z
    .string()
    .trim()
    .min(10, 'Vui lòng nhập địa chỉ đầy đủ (số nhà, đường, quận/huyện, tỉnh/thành)')
    .max(255, 'Địa chỉ quá dài'),

  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional().or(z.literal('')),

  paymentGateway: z.enum(['VNPAY', 'COD'], {
    errorMap: () => ({ message: 'Vui lòng chọn phương thức thanh toán' }),
  }),
})

/**
 * Validate form và trả về { success, errors, data }.
 * `errors` là object { fieldName: message } để bind trực tiếp vào UI.
 */
export function validateShippingForm(form) {
  const result = shippingSchema.safeParse(form)
  if (result.success) {
    return { success: true, errors: {}, data: result.data }
  }
  const errors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (!errors[field]) errors[field] = issue.message
  }
  return { success: false, errors, data: null }
}
