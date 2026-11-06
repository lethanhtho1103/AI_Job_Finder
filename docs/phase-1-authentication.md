# Giai đoạn 1 — Authentication cơ bản

## Nguồn yêu cầu và quyết định

Yêu cầu người dùng ngày 06/11/2026, “TRIỂN KHAI GIAI ĐOẠN 1 — AUTHENTICATION CƠ BẢN”, ưu tiên hơn auth trong PRD: **username/password-only**, register/login/logout, Role User/Administrator và seed Admin. Không email/name/phone, verification/reset/change-password UI, OAuth/OTP/avatar/profile/user-management hoặc nghiệp vụ phase 2.

Better Auth username plugin vẫn đăng ký qua signUp.email, cần email/name. Chọn **NextAuth 4.24.15 Credentials**, stable hiện có peer support Next.js 16/React 19; V5 còn beta khi kiểm tra. Không fake email, sửa thư viện hoặc tự viết cookie/session crypto. Credentials dùng JWT và không tự persist user qua adapter, nên Prisma lưu tài khoản riêng và không dùng PrismaAdapter.

Nguồn chính thức: [Better Auth Username](https://better-auth.com/docs/plugins/username), [NextAuth Credentials](https://next-auth.js.org/providers/credentials), [Options/cookies](https://next-auth.js.org/configuration/options), [Vercel request headers](https://vercel.com/docs/headers/request-headers).

## Contract và database

- Username 3–32 ASCII chữ/số/gạch dưới, bắt đầu chữ/số. Trim ở biên, giữ casing hiển thị; usernameKey lowercase unique. SQL CHECK normalized/format và unique constraint chống trùng cả khi đồng thời.
- Password đăng ký 8–128 ký tự, không trim; confirm khớp. Zod client/server, strict input từ chối role. User mới luôn Role User ở service và DB default.
- Hash Node crypto scrypt N=32768/r=8/p=3, salt 16 bytes ngẫu nhiên, key 64 bytes, timingSafeEqual. Username không tồn tại vẫn chạy dummy hash; không plaintext/log/localStorage.
- User: UUID/String id, username, usernameKey unique, passwordHash, Role User/Administrator, developmentOnly, timestamps UTC. FK userId tương lai dùng String @db.Uuid.
- AuthSession: UUID id/userId FK, expiry cố định 8 giờ, indexes userId/expiry. Registry thu hồi encrypted JWT do NextAuth tạo; token chỉ chứa sessionId/user identity, không password. Không lưu cookie/JWT thô.
- AuthRateLimit: HMAC key, count/expiry và index; atomic PostgreSQL upsert chia sẻ giữa Functions. Không lưu username/IP nguyên văn.
- Migration `20261106000100_authentication` chỉ tạo ba bảng auth. Install/build generate Prisma Client; không migrate hoặc seed tự động. Runtime adapter-pg cùng version Prisma 7.10.1, Neon pooled/runtime và direct/CLI tách biệt.

## Security và seed

NextAuth quản lý encrypted JWT, CSRF và cookies HttpOnly/SameSite=Lax, Secure trên HTTPS. NEXTAUTH_SECRET >=32 ký tự, không fallback app secret. Role/owner/expiry đọc lại từ DB; không tin session update do client gửi. Server layout và page đều gọi requireUser; cache chỉ theo request. SignOut xóa registry/cookie, replay token đã logout bị từ chối.

Đăng ký: JSON cùng origin NEXTAUTH_URL, body tối đa 4 KiB cả chunked. Login 30/address/15 phút và 10/normalized username/15 phút; register 5/address/giờ, gồm dữ liệu sai. Chỉ tin IP header Vercel ghi đè khi chạy Vercel, ngoài đó bucket shared chống spoof proxy headers. Self-host nhiều người cần trusted ingress contract riêng. Expired counters/sessions không được chấp nhận; quản trị có thể dọn qua indexes, chưa có scheduler.

Lỗi username/password dùng thông báo chung; config/DB lỗi trả mã an toàn. Logger không in metadata NextAuth/request/token. Thiếu credentials không báo thành công giả.

Prisma seed CLI dynamic-import `prisma/development-admin.ts` chỉ khi NODE_ENV=development và ngoài Vercel. Default admin/123456 chỉ trong file seed này, không import vào src/production bundle. Seed default gắn developmentOnly=true: Production chặn cả credentials và session của account này.

Ngoài Development local, cần ADMIN_PASSWORD 16–128 ký tự có hoa/thường/số/ký tự đặc biệt. Seed nhiều lần không đổi password/role/updatedAt. Nếu username admin thuộc User, hoặc là admin development-only khi seed Production, báo lỗi thay vì nâng quyền/reset/mở khóa. Upsert unique key tránh trùng khi seed đồng thời. Không in password/hash.

Sau cấu hình env và review/apply migration:

```powershell
$env:NODE_ENV = 'development'
npm run db:seed
Remove-Item Env:NODE_ENV
npm run dev
```

Production dùng env/secrets mạnh, không set NODE_ENV=development. Dùng database Production riêng hoặc quy trình quản trị chuyển đổi an toàn; seed không tự sửa account đã tồn tại để vượt guard.

## UI và hành vi chuẩn

Giữ theme/SiteShell/font hệ thống. AuthScreen/AuthForm dùng chung Login/Register, Dashboard chỉ chào user và role thật, không statistics/jobs giả.

| Flow           | Pending                                             | Thành công                                                         | Thất bại/khôi phục                                                                             | Nguồn               |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------- |
| Register       | noValidate, Zod, lock submit/spinner                | /login?registered=1 và banner                                      | Field error/focus đầu; duplicate gắn username; lỗi mạng inline, giữ dữ liệu                    | Yêu cầu mục 2A/6    |
| Login          | Username/password, autocomplete/toggle, lock submit | /dashboard; người đã login vào Login/Register được server redirect | Generic invalid credentials, xóa password/focus lại; mã rate limit/service unavailable an toàn | Yêu cầu mục 2B/7    |
| Logout         | Button trong protected layout, lock/spinner         | Xóa registry/cookie, về /login                                     | Inline error, thử lại khi chưa hoàn tất                                                        | Yêu cầu mục 2C      |
| Protected page | Server đọc session/user/role/expiry                 | Hiển thị user hiện tại                                             | Chưa login/expired/revoked/dev-only Production → Login                                         | Yêu cầu mục 2B/2C/7 |

Full navigation tới URL cùng origin cố định qua auth boundary để xóa client/router cache, không dùng return URL từ client/domain ngoài. Password toggle là button keyboard/aria-pressed, cho paste/password manager. Antd Form quản lý labels/errors/aria, Zod server là nguồn validation; feedback live region và giữ chỗ. Không native dialogs hoặc unsaved-password confirmation.

Canonical owners: Form=AuthForm/Antd/Zod, Password=PasswordInput trong auth-form, Scrollbar=globals.css, Feedback=inline Antd Alert, Navigation/logout=auth components/server guards. Không có select/date/table/destructive dialogs trong phase này; contract được giữ tại đây thay vì thêm UX-CONTRACT.md rỗng.

## Kiểm thử

Unit: username/password schemas, hash verification, seed guards. E2E dùng PostgreSQL local thật: migration/register/duplicate case/password/role injection, login/logout/replay/expiry, admin dev/prod guards, seed idempotency, CSRF/rate limit, keyboard/axe/responsive desktop/mobile. Chạy development (default admin được phép) và production build (default admin bị chặn).

Không có Neon credentials thì local PostgreSQL không chứng minh Neon hoặc cloud deployment. Không tự tạo resources/remote/commit/push hoặc phase 2. Kết quả thực tế ở báo cáo Giai đoạn 1 khi bàn giao.
