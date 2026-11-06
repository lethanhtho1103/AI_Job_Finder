# Báo cáo Giai đoạn 1 — Authentication cơ bản

Ngày 06/11/2026. Phạm vi theo yêu cầu username/password-only của người dùng, thay phần auth/email của PRD. Chưa triển khai Giai đoạn 2.

## Kiểm tra Neon sau khi người dùng cấu hình .env

Đã đọc lại PRD, AGENTS.md, skill và Implementation Plan. Source Giai đoạn 1 đã có đủ register/login/logout username-only, roles, schema/migration và seed; không khởi tạo lại hoặc triển khai nghiệp vụ mới.

- DATABASE_URL pooled và DIRECT_URL direct đều kết nối thật thành công với transaction_read_only=on, cùng project ID `tiny-cake-04873140`, branch ID `br-wispy-tooth-a1v4uyeg`, endpoint ID `ep-shy-lab-a16f7uzz`, database neondb.
- Người dùng đã đối chiếu các ID trong Neon Console và xác nhận đúng **branch development**. Sau xác nhận, đã đọc lại metadata từ cả pooled/direct ngay trước migration, và đối chiếu lại trước seed/thao tác kiểm thử. Không truy cập hoặc ghi branch production.
- Đã apply migration `20261106000100_authentication` thành công trên development. `prisma migrate status` báo schema up to date; `db:check` SELECT 1 thành công.
- Đã chạy seed Development hai lần: chỉ một admin, role Administrator, developmentOnly=true; password default xác minh đúng bằng hash; id/passwordHash/updatedAt giữ nguyên ở lần seed sau. Không in hash hoặc credentials.
- Kiểm tra trình duyệt với Neon thật đạt 10 assertions: chặn Dashboard chưa login; Admin login đúng role; cookie HttpOnly/SameSite; người đã login về Dashboard; logout thu hồi token; register mặc định User; duplicate username hoa/thường bị chặn; User login; client không tự đổi id/role; sau logout không truy cập Dashboard. Tài khoản User kiểm thử tạm đã xóa có điều kiện theo id/username/role, Admin được giữ lại.
- Lint, typecheck, format check và production build đạt; 28 unit tests trong 5 files đạt. Build chỉ generate Prisma Client, không migrate/seed.
- NEXTAUTH_URL và secret đã được cấu hình; không in/lưu credentials vào báo cáo. Những kết quả E2E với PostgreSQL local trong các phần bên dưới là lịch sử kiểm thử implementation, không phải bằng chứng đã migrate/seed Neon.

Giai đoạn 1 đã được triển khai và kiểm tra trên Neon development. Để dùng: `npm run dev`, mở http://localhost:3000/login bằng admin/default hoặc /register để tạo User. Các kết quả E2E local bên dưới vẫn là lịch sử riêng; không báo chúng thành kiểm thử cloud. Production build đạt; phép thử bổ sung mở production server trên port 3100 trong lần kiểm tra Neon bị bộ duyệt công cụ từ chối với lý do `blocked by policy`, nên không khẳng định đã chạy production server trên Neon lần này.

## Kết quả

- Register chỉ username/password/confirm; Zod client/server, username ASCII 3–32 ký tự, normalized unique case-insensitive. Password mới 8–128 ký tự; confirm khớp; role User cố định, từ chối client tự chọn quyền.
- Login username/password, toggle có keyboard/aria/autocomplete; lỗi sai credentials chung; loading và chống submit trùng. Người đã login được redirect Dashboard khi mở Login/Register.
- Logout trong protected layout, xóa session registry/cookie; replay token cũ không truy cập được. Server guard ở cả layout/page. Dashboard chỉ chào user/role thật, không làm trước nghiệp vụ dashboard thống kê.
- Admin seed idempotent, hash scrypt tương thích login; không reset password hoặc nâng quyền account có sẵn. Default admin/123456 chỉ Development local. Account default gắn developmentOnly, bị chặn login/session ngoài Development local, kể cả Production dùng cùng DB.
- Rate limits PostgreSQL atomic, CSRF thư viện và same-origin/body limit ở register; không log password/token/credentials.

## Lựa chọn công nghệ và models

NextAuth **4.24.15 Credentials stable** hỗ trợ Next.js 16/React 19. Better Auth username plugin vẫn yêu cầu email/name khi signup, không phù hợp yêu cầu không fake email; NextAuth v5 đang beta lúc kiểm tra. Không dùng PrismaAdapter vì Credentials dùng encrypted JWT, user persistence do service Prisma quản lý. Thư viện quản lý crypto/cookie/CSRF, database registry thêm khả năng revocation.

Prisma Client và adapter-pg **7.10.1**, PostgreSQL. Ba models: User (UUID, normalized unique username, passwordHash, Role, developmentOnly), AuthSession (user FK/expiry/indexes), AuthRateLimit (HMAC key/count/expiry). Migration **20261106000100_authentication** có SQL CHECK username format/normalization, unique/index/FK. Không có email/Account/Verification hoặc bảng nghiệp vụ khác.

Schema/client/migration và seed ở prisma/; server code ở src/server/auth và src/server/db/client.ts; UI/Zod ở src/modules/auth; routes ở src/app/(public), src/app/(dashboard), src/app/api/auth. Các secret/runtime server modules không được import vào client. Default dev password không nằm trong app source hoặc production bundle.

## Kiểm tra đã thực hiện

Format check đạt; strict UI audit 0 findings; DESIGN lint 0 errors/0 warnings. Git diff whitespace check đạt, không phát hiện secrets thật trong source bàn giao. Migration status trên database test báo up to date. Đã dừng PostgreSQL cluster tạm sau khi kiểm thử xong.

| Kiểm tra                       | Kết quả                                                                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint / Typecheck               | Đạt, không warning source                                                                                                                            |
| Unit                           | 28 tests, 5 files đạt: phase 0 contracts, username/password/hash/seed guards                                                                         |
| Production build               | Đạt; generate client không migrate; home/404 static, auth/dashboard dynamic                                                                          |
| Development E2E                | 20 tests desktop/mobile đạt; Admin default đăng nhập thật và role Administrator                                                                      |
| Production E2E                 | 20 tests desktop/mobile đạt; normal User login được, Admin development-only bị từ chối                                                               |
| Session/authorization          | Cookie HttpOnly/SameSite Lax; role/id client session update bị bỏ qua; replay logout và expiry DB bị từ chối; /dashboard chưa login về Login         |
| Validation/security            | Duplicate uppercase, invalid password/confirm/username, role injection, same-origin, CSRF và rate limit có kiểm tra thực qua HTTP                    |
| Seed/migration PostgreSQL thật | Apply migration thành công; CLI seed hai lần; một admin, hash không plaintext, lần sau giữ id/passwordHash/updatedAt; không tự nâng User thành Admin |
| Accessibility/UI               | Axe desktop/mobile Login/Register đạt; label/focus/toggle/keyboard/no horizontal overflow; đã xem screenshots và giữ theme phase 0                   |
| Prisma                         | Generate và schema validation đạt; migrations không chạy trong build                                                                                 |
| Skill                          | Validator đạt; runtime phiên này đã liệt kê ai-job-finder trong available skills                                                                     |
| Dependencies production        | npm audit --omit=dev: 0 vulnerabilities tại thời điểm kiểm tra                                                                                       |

Database kiểm thử là cluster PostgreSQL 17 tạm riêng trong TEMP, chỉ listen loopback, port riêng, database ai_job_finder_test; không dùng service hoặc database cá nhân đang có. Test source chặn URL không phải loopback/database đúng tên trước khi ghi/xóa. Secret Playwright sinh ngẫu nhiên trong process, không lưu vào source/.env. Các tests replay/expiry cố ý tạo log AUTH_REQUEST_FAILED đã loại metadata.

Các E2E local ở bảng trên được thực hiện trước khi có Neon credentials. Lần xác minh mới đã bổ sung pooled/direct connection, migration/seed và smoke auth trên Neon development thật như phần đầu báo cáo. Chưa triển khai Vercel và chưa kiểm thử Safari/iOS thật; Chromium mobile emulation không thay thế thiết bị thật.

## Cách cấu hình và chạy

1. `npm ci`, sao chép `.env.example` thành `.env` nếu chưa có.
2. Điền DATABASE_URL pooled Neon, DIRECT_URL direct cùng DB; NEXTAUTH_URL canonical (local http://localhost:3000, Production HTTPS); NEXTAUTH_SECRET ngẫu nhiên >=32 ký tự.
3. Review migration/backup nếu DB có dữ liệu, `npm run db:validate`, `npm run db:deploy`.
4. Development local: đặt NODE_ENV=development khi `npm run db:seed`, sau đó bỏ env override và chạy `npm run dev`; mở /login dùng admin/default. Hoặc /register để tạo User rồi login.
5. Seed ngoài Development cần ADMIN_PASSWORD mạnh 16–128 ký tự có hoa/thường/số/ký tự đặc biệt qua environment secrets. Seed không tự chuyển admin default sang production; dùng database riêng/quy trình quản trị an toàn.

Lệnh PowerShell đầy đủ, E2E local setup, security limits và source links ở [README](../README.md) và [đặc tả auth](phase-1-authentication.md). Implementation Plan, AGENTS.md, DESIGN.md và skill references đã cập nhật theo quyết định username-only.

## Phần còn lại và Git

Neon development đã được xác minh, migrate/seed và kiểm tra auth thật. Vercel deployment chưa thực hiện; không tự tạo external resources hoặc deploy. Không email/verification/reset/change-password UI/OAuth/OTP/avatar/profile/user-management/CV/AI/jobs. Chưa có business data nên authorization test kiểm tra identity/role/session trên Dashboard, không giả định đã test ownership của modules tương lai.

Audit toàn bộ vẫn có 8 moderate trong dev tooling ESLint/TypeScript-ESLint/minimatch như phase 0; không tự force đổi major/downgrade stack. Expired auth records cần cleanup vận hành có kiểm soát khi dùng lâu dài; không thêm scheduler vào scope.

Không commit, push hoặc sửa remote. Commit message đề xuất:

```text
feat: add username authentication and development admin seed
```
