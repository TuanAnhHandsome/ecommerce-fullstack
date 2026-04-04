# 🛒 E-Commerce Clone — Full Stack
**React.js + Tailwind CSS · Spring Boot 3 · MySQL · VNPay Sandbox**

---

## 📁 Project Structure

```
ecommerce/
├── backend/                         ← Spring Boot
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/ecommerce/
│       │   ├── config/              SecurityConfig.java
│       │   ├── controller/          Auth, Product, Cart, Order, Payment, Admin
│       │   ├── dto/                 request/ + response/
│       │   ├── entity/              User, Product, Category, CartItem, Order, OrderItem, Payment
│       │   ├── enums/               Role, OrderStatus, PaymentStatus, PaymentGateway
│       │   ├── exception/           GlobalExceptionHandler, ResourceNotFoundException
│       │   ├── payment/vnpay/       VNPayConfig.java, VNPayService.java  ← CORE
│       │   ├── repository/          JPA Repositories
│       │   ├── security/            JwtService, JwtAuthenticationFilter
│       │   └── service/impl/        OrderServiceImpl, ProductServiceImpl, ...
│       └── resources/
│           └── application.yml
│
├── frontend/                        ← React + Tailwind
│   └── src/
│       ├── components/
│       │   ├── admin/               Dashboard, UserTable, OrderTable, ProductForm
│       │   ├── common/              Navbar, Footer, Pagination, Loading
│       │   ├── product/             ProductCard, ProductGrid, ProductDetail
│       │   └── cart/                CartDrawer, CartItem
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── ProductsPage.jsx
│       │   ├── ProductDetailPage.jsx
│       │   ├── CartPage.jsx
│       │   ├── CheckoutPage.jsx     ← Payment flow starts here
│       │   ├── VNPayReturnPage.jsx  ← VNPay redirects here
│       │   ├── OrdersPage.jsx
│       │   └── admin/
│       │       ├── DashboardPage.jsx
│       │       ├── ProductsAdminPage.jsx
│       │       ├── OrdersAdminPage.jsx
│       │       └── UsersAdminPage.jsx
│       ├── services/api.js          Axios + interceptors
│       ├── store/authStore.js       Zustand auth
│       └── store/cartStore.js       Zustand cart
│
└── docs/
    └── schema.sql                   ← Chạy file này đầu tiên
```

---

## 🚀 Setup Guide

### 1. Database
```bash
mysql -u root -p < docs/schema.sql
```

### 2. Backend
```bash
cd backend

# Sửa application.yml:
# - spring.datasource.password: your_mysql_password
# - vnpay.tmn-code: lấy từ sandbox.vnpayment.vn
# - vnpay.hash-secret: lấy từ sandbox.vnpayment.vn

mvn spring-boot:run
# Server chạy tại http://localhost:8080/api
```

### 3. Frontend
```bash
cd frontend
npm create vite@latest . -- --template react
npm install axios zustand react-router-dom react-hot-toast

# Thêm Tailwind:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Tạo .env:
echo "VITE_API_URL=http://localhost:8080/api" > .env

npm run dev
# Frontend chạy tại http://localhost:5173
```

---

## 💳 VNPay Sandbox Setup

### Bước 1: Đăng ký sandbox
1. Vào https://sandbox.vnpayment.vn/devreg/
2. Đăng ký tài khoản developer
3. Lấy **TMN Code** và **Hash Secret** từ dashboard
4. Điền vào `application.yml`

### Bước 2: Test card (Sandbox)
```
Ngân hàng: NCB
Số thẻ:    9704198526191432198
Tên:       NGUYEN VAN A
Ngày hết:  07/15
OTP:       123456
```

### Bước 3: VNPay Response Codes
| Code | Ý nghĩa |
|------|---------|
| `00` | ✅ Thành công |
| `07` | Trừ tiền thành công, nghi ngờ giao dịch |
| `09` | Thẻ/Tài khoản chưa đăng ký dịch vụ |
| `10` | Xác thực sai quá 3 lần |
| `11` | Đã hết hạn chờ thanh toán |
| `24` | ❌ Khách hàng hủy giao dịch |
| `51` | Tài khoản không đủ số dư |
| `65` | Vượt hạn mức giao dịch ngày |
| `75` | Ngân hàng bảo trì |

---

## 🔐 Payment Flow Chi Tiết

```
1. User click "Đặt hàng ngay"
   └─ CheckoutPage.jsx → POST /orders  (tạo order, trừ stock, clear cart)

2. Frontend nhận orderId → POST /payment/create-payment
   └─ Backend: VNPayService.createPaymentUrl()
      ├─ Build params TreeMap (sorted)
      ├─ HMAC-SHA512 signature
      ├─ Lưu Payment record (PENDING)
      └─ Trả về paymentUrl

3. Frontend: window.location.href = paymentUrl
   └─ User ở trang VNPay sandbox, nhập test card

4. User thanh toán xong, VNPay làm 2 việc đồng thời:
   a) REDIRECT user → GET /payment/vnpay-return?vnp_ResponseCode=00&...
      └─ Frontend hiển thị "Thành công / Thất bại"
   
   b) IPN WEBHOOK → GET /payment/vnpay-ipn?vnp_ResponseCode=00&...  (server-to-server)
      └─ Backend:
         ├─ Verify HMAC-SHA512 chữ ký
         ├─ Kiểm tra số tiền khớp
         ├─ Idempotency check (đã xử lý chưa?)
         ├─ Update Order.status = PAID
         ├─ Update Payment.status = SUCCESS
         └─ Response {"RspCode":"00","Message":"Confirm success"}
```

> ⚠️ **QUAN TRỌNG**: Chỉ cập nhật DB tại IPN webhook, KHÔNG tại Return URL.
> Return URL có thể bị user giả mạo. IPN là server-to-server, an toàn hơn.

---

## 🔑 Default Accounts (Seeded)

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| ADMIN | admin@ecommerce.vn     | Admin@123  |
| USER  | user@ecommerce.vn      | User@123   |

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh?refreshToken=...
```

### Products (Public)
```
GET  /api/products?page=0&size=12&keyword=iphone&categoryId=1
GET  /api/products/{id}
GET  /api/products/slug/{slug}
```

### Products (Admin only)
```
POST   /api/products          (multipart: product JSON + image file)
PUT    /api/products/{id}
DELETE /api/products/{id}
```

### Cart (Authenticated)
```
GET    /api/cart
POST   /api/cart/items        { productId, quantity }
PUT    /api/cart/items/{productId}?quantity=2
DELETE /api/cart/items/{productId}
DELETE /api/cart
```

### Orders (Authenticated)
```
POST /api/orders              (creates order from cart)
GET  /api/orders              (my orders)
GET  /api/orders/{id}
```

### Orders (Admin)
```
GET /api/orders/admin/all?status=PAID
PUT /api/orders/admin/{id}/status?status=SHIPPED
```

### Payment
```
POST /api/payment/create-payment   { orderId }  → { paymentUrl }
GET  /api/payment/vnpay-return     (VNPay redirect)
GET  /api/payment/vnpay-ipn        (VNPay IPN webhook — server-to-server)
```

### Admin Dashboard
```
GET /api/admin/dashboard
GET /api/admin/users?page=0&keyword=...
PUT /api/admin/users/{id}/toggle-status
```

---

## 📦 Frontend Dependencies

```bash
npm install \
  axios \
  zustand \
  react-router-dom \
  react-hot-toast \
  @tanstack/react-query \
  recharts \           # dashboard charts
  react-hook-form \
  @hookform/resolvers \
  zod                  # form validation
```

---

## 🗂️ Next Steps (Implementation Order)

1. **Backend** (tuần tự):
   - [ ] Tạo `AppConfig.java` (PasswordEncoder, AuthenticationProvider, JpaAuditing)
   - [ ] Implement `AuthService`, `ProductService`, `CartService`
   - [ ] `GlobalExceptionHandler` (@ControllerAdvice)
   - [ ] `AdminService.getDashboardStats()`
   - [ ] Test VNPay IPN với ngrok (để expose localhost ra internet)

2. **Frontend** (tuần tự):
   - [ ] Setup Vite + Tailwind + Router
   - [ ] Layout: Navbar + Footer
   - [ ] ProductsPage + ProductDetailPage
   - [ ] CartPage (CartStore)
   - [ ] Auth: LoginPage + RegisterPage
   - [ ] CheckoutPage + VNPayReturnPage  ← Payment flow
   - [ ] OrdersPage (lịch sử đơn hàng)
   - [ ] Admin: Dashboard + CRUD

3. **Test VNPay**:
   ```bash
   # Dùng ngrok để tạo public URL cho VNPay IPN gọi về localhost
   ngrok http 8080
   # Cập nhật vnpay.return-url và IPN URL trong dashboard VNPay sandbox
   ```
