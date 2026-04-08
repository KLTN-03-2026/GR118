# PublicReportingSystem

Backend API cho hệ thống báo cáo công khai với xác thực người dùng và Google OAuth2.

## Cài đặt

```bash
npm install
```

## Cấu hình

1. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

2. Cập nhật các biến môi trường trong `.env`:
   - `SECRET_KEY`: Khóa bí mật cho JWT
   - `JWT_REFRESH_SECRET`: Khóa bí mật cho refresh token
   - `MONGODB_URI`: URI kết nối MongoDB
   - `GOOGLE_CLIENT_ID`: Client ID từ Google Cloud Console (cho Google Login)

### Cấu hình Google OAuth2

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Tạo **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (hoặc domain của bạn)
   - Authorized redirect URIs: Thêm URLs cần thiết cho frontend
5. Copy **Client ID** và paste vào `.env` file

## Chạy ứng dụng

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập bằng email/username
- `POST /api/auth/login-google` - Đăng nhập bằng Google
- `POST /api/auth/refresh` - Làm mới access token
- `POST /api/auth/logout` - Đăng xuất

### Google Login API

**Endpoint:** `POST /api/auth/login-google`

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4M..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome back username",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "123456",
    "userName": "username",
    "email": "user@example.com"
  }
}
```

**Lưu ý:** 
- Sử dụng ID Token từ Google (không phải Access Token)
- Token được verify với Google trước khi tạo session
- Tự động tạo tài khoản mới nếu email chưa tồn tại

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Google OAuth2
- bcrypt
- Rate limiting



## 📂 Cấu trúc project
      D:\KLTN\NODE-EXPRESS-MONGO\SRC
          │   app.ts
          │   server.ts
          │   
          ├───config
          │       database.ts
          │       r2.ts
          │       
          ├───constant
          │       action.ts
          │       error.ts
          │       resource.ts
          │       role.ts
          │
          ├───dtos
          │   └───auth
          │           permission.ts
          │           role.ts
          │           user.ts
          │
          ├───entity
          ├───helper
          │   │   pageAray.ts
          │   │
          │   └───features
          │       └───r2
          │               r2-delete.ts
          │               r2-upload.ts
          │
          ├───mapper
          │   └───auth
          │           permission.mapper.ts
          │           role.mapper.ts
          │           user.mapper.ts
          │
          ├───middlewares
          │       checkPermission.ts
          │       error-handing.ts
          │       isAuthenticated.ts
          │       rate-limit.middleware.ts
          │       upload.middleware.ts
          │
          ├───models
          │   │   auth.model.ts
          │   │
          │   └───auth
          │           actions.ts
          │           permissions.ts
          │           permission_actions.ts
          │           resources.ts
          │           roles.ts
          │           role_permissions.ts
          │           user_role.ts
          │
          ├───modules
          │   │   auth.controller.ts
          │   │   user.controller.ts
          │   │
          │   └───admin.controller
          │           permission.ts
          │           role.ts
          │           user.ts
          │
          ├───repos
          │   │   index.ts
          │   │
          │   ├───aggregation
          │   │       permission.ts
          │   │       role.ts
          │   │       user.ts
          │   │
          │   ├───auth
          │   │       permission.repos.ts
          │   │       roles.repos.ts
          │   │       user.repos.ts
          │   │
          │   └───user
          ├───routers
          │       auth.router.ts
          │       user.router.ts
          │
          ├───script
          │       data.ts
          │
          └───utils
                  app-error.ts



### 🔹 Root

- `app.ts`: Khởi tạo app Express, config middleware
- `server.ts`: Entry point, start server

---

### 🔹 config/

- `database.ts`: Kết nối MongoDB
- `r2.ts`: Cấu hình Cloudflare R2

---

### 🔹 constant/

Chứa các hằng số dùng toàn hệ thống:
- `action.ts`: danh sách action (create, read, update, delete...)
- `resource.ts`: tài nguyên (user, role...)
- `role.ts`: role mặc định
- `error.ts`: message lỗi

---

### 🔹 dtos/

Định nghĩa **data trả về (response shape)**

- `auth/permission.ts`
- `auth/role.ts`
- `auth/user.ts`

👉 Dùng để chuẩn hóa response API

---

### 🔹 helper/

- `pageArray.ts`: xử lý phân trang
- `features/r2/`: upload & delete file

---

### 🔹 mapper/

Convert dữ liệu từ DB → DTO

- `permission.mapper.ts`
- `role.mapper.ts`
- `user.mapper.ts`

👉 Tách logic mapping ra khỏi controller → clean code

---

### 🔹 middlewares/

- `checkPermission.ts`: kiểm tra quyền (RBAC)
- `isAuthenticated.ts`: xác thực user
- `error-handling.ts`: xử lý lỗi global
- `rate-limit.middleware.ts`: chống spam API
- `upload.middleware.ts`: xử lý upload file

---

### 🔹 models/

Định nghĩa schema MongoDB (RBAC core)

- `roles.ts`
- `permissions.ts`
- `resources.ts`
- `actions.ts`
- `role_permissions.ts`
- `permission_actions.ts`
- `user_role.ts`

👉 Đây là **core của hệ thống phân quyền**

---

### 🔹 modules/ (Controller)

- `auth.controller.ts`
- `user.controller.ts`
- `admin.controller/*`

👉 Nơi định nghĩa API endpoints

---

### 🔹 repos/

Layer truy vấn database

#### auth/
- `user.repos.ts`
- `roles.repos.ts`
- `permission.repos.ts`

#### aggregation/
- `user.ts`
- `role.ts`
- `permission.ts`

👉 Dùng cho query phức tạp (join nhiều collection)

---

### 🔹 routers/

- `auth.router.ts`
- `user.router.ts`

👉 Định nghĩa route → mapping tới controller

---

### 🔹 utils/

- `app-error.ts`: custom error

---

## 🔄 Flow xử lý API

Flow của một API trong hệ thống:

### 1. Request vào Router
- Client gọi API → `router`

### 2. Router → Middleware
- Xác thực (`isAuthenticated`)
- Kiểm tra quyền (`checkPermission`)
- Gắn Resource và Action phù hợp (có thể định nghĩa resource và action mới trong constant nếu chưa có)
- Resource và Action mới sẽ được tạo trên database, chưa có UI nên phải gán thủ công bằng API
- Check Rate limit / upload (nếu có)

### 3. Controller xử lý logic chính
- Nhận request
- Validate dữ liệu
- Gọi repo để truy vấn DB
- Gọi AppError để trả lỗi thích hợp( định nghĩa lỗi trong constant/error.ts)

### 4. Repository (repos/)
- Thực hiện query MongoDB
- Nếu query đơn giản → dùng repo thường
- Nếu query phức tạp → dùng `aggregation/`

### 5. Mapping dữ liệu
- Dữ liệu từ DB → mapper → DTO

### 6. Response
- Controller trả response chuẩn hóa về client

---

## 🧠 Kiến trúc & Design

- Tách layer rõ ràng:
  - Router
  - Middleware
  - Controller
  - Repository
  - Mapper
  - DTO

- Áp dụng:
  - Separation of Concerns
  - Clean Architecture (mức cơ bản)
  - RBAC pattern

---

## 🔐 RBAC (Permission System)

Hệ thống phân quyền dựa trên:

- User → Role
- Role → Permission
- Permission → Resource + Action

Ví dụ:
Middleware `checkPermission` sẽ:
- Lấy role của user
- Kiểm tra permission tương ứng
- Cho phép hoặc từ chối request
