# AI Job Finder

Next.js app module-first cho tìm việc cá nhân. Hiện có nền tảng Giai đoạn 0 và **Authentication cơ bản Giai đoạn 1**: username/password register/login/logout, protected Dashboard và seed Administrator. Chưa có CV, AI hoặc tìm việc.

Đọc [PRD](AI_Job_Finder_PRD_NextJS_Database_Roadmap_Codex_2026.docx), [implementation plan](docs/implementation-plan.md), [điều chỉnh auth](docs/phase-1-authentication.md), [AGENTS.md](AGENTS.md) và [skill dự án](.agents/skills/ai-job-finder/SKILL.md) trước khi phát triển tiếp. Yêu cầu username-only thay phần auth/email của PRD; không email giả.

## Cài đặt

Cần Node.js **24.x**, npm và Neon PostgreSQL (hoặc PostgreSQL local cho development/test).

```powershell
npm ci
Copy-Item .env.example .env
```

Install generate Prisma Client, không migrate/seed tự động. Điền `.env`:

| Biến            | Mục đích                                                           |
| --------------- | ------------------------------------------------------------------ |
| DATABASE_URL    | Neon pooled URL runtime, có sslmode=require                        |
| DIRECT_URL      | Neon direct URL cùng database, dùng Prisma CLI/migration/seed      |
| NEXTAUTH_URL    | Canonical origin: local http://localhost:3000, Production HTTPS    |
| NEXTAUTH_SECRET | Secret ngẫu nhiên >=32 ký tự, ổn định giữa các instances           |
| ADMIN_PASSWORD  | Tùy chọn Development; ngoài Development cần password mạnh khi seed |

Có thể dùng password manager tạo secret ngẫu nhiên 32 bytes trở lên rồi điền vào NEXTAUTH_SECRET trong `.env`. Không in secret trong log hoặc commit vào Git. Thay secret làm cookie/CSRF cũ mất hiệu lực.

Review SQL migration, chọn đúng database và backup nếu có dữ liệu, sau đó:

```powershell
npm run db:validate
npm run db:deploy
npm run dev
```

Mở `/register`: username 3–32 ASCII chữ/số/gạch dưới, bắt đầu chữ/số; password 8–128 ký tự và confirm khớp. Sau thành công về Login, đăng nhập → Dashboard, logout → Login. Username không phân biệt hoa thường, account mới luôn Role User.

Trang chủ và `/api/health` vẫn chạy không cần credentials. Login/Register hiển thị tạm chưa sẵn sàng khi thiếu auth config. Health chỉ liveness, không chứng minh Neon đã kết nối. Không email/verify/reset/OAuth/avatar/user-management trong phase 1.

## Seed Admin Development

Sau migration, chỉ trên môi trường Development local:

```powershell
$env:NODE_ENV = 'development'
npm run db:seed
Remove-Item Env:NODE_ENV
npm run dev
```

Đăng nhập bằng **admin / 123456**. Chạy seed nhiều lần không đổi mật khẩu/role của account đã tồn tại. Username admin thuộc User thì seed báo lỗi thay vì nâng quyền.

Default password chỉ nằm trong file seed Development, không thuộc code/bundle app Production. Account seed default có `developmentOnly=true`, bị chặn login/session trên Production. Ngoài Development local hoặc trên Vercel, seed cần ADMIN_PASSWORD qua env/secrets: 16–128 ký tự có hoa/thường/số/ký tự đặc biệt. Seed không tự reset admin Development khi chuyển Production; dùng database Production riêng hoặc quy trình quản trị an toàn.

## Các lệnh

| Lệnh                                          | Chức năng                                                      |
| --------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                 | Development server                                             |
| `npm run build`                               | Generate Prisma Client và production build; không migrate/seed |
| `npm run start`                               | Production server từ build đã có                               |
| `npm run lint` / `npm run typecheck`          | ESLint / TypeScript strict                                     |
| `npm run format:check` / `npm run format`     | Kiểm tra / sửa Prettier                                        |
| `npm test` / `npm run test:watch`             | Vitest                                                         |
| `npm run test:e2e`                            | Production smoke; auth E2E khi có database test                |
| `npm run db:generate` / `npm run db:validate` | Generate client / validate schema                              |
| `npm run db:migrate`                          | Tạo migration development, không dùng production               |
| `npm run db:deploy`                           | Apply migrations đã review qua DIRECT_URL                      |
| `npm run db:seed`                             | Prisma Admin seed với environment guards                       |
| `npm run db:check`                            | Neon SELECT 1, timeout 10s, không ghi dữ liệu                  |

## Kiểm thử

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

Full auth E2E cần **PostgreSQL local riêng tên ai_job_finder_test**, đã apply migration. Suite chỉ chấp nhận loopback/database đúng tên vì có ghi dữ liệu, xóa counters và kiểm tra seed; không trỏ database đang dùng.

```powershell
$env:TEST_DATABASE_URL = 'postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/ai_job_finder_test'
$env:AUTH_E2E_DEVELOPMENT = '1'
npm run test:e2e
Remove-Item Env:AUTH_E2E_DEVELOPMENT
npm run build
npm run test:e2e
```

Playwright tự tạo secret cho test process, dùng origin `127.0.0.1:3100`, TEST_DATABASE_URL cho server và một worker tránh counters ảnh hưởng nhau. Không có TEST_DATABASE_URL thì auth integration ghi skip. Development kiểm tra default admin đăng nhập được; Production kiểm tra bị chặn. Ảnh/trace ở `test-results/` ignored; không chia sẻ trace chứa cookie/password test.

## Kiến trúc và bảo mật

`src/app` là entrypoints mỏng; `src/modules/auth` giữ UI/Zod; `src/server/auth` giữ credentials/session/rate limits; `src/server/db` giữ Prisma singleton. NextAuth 4 stable quản lý encrypted JWT/CSRF/cookies, Prisma registry cho revocation. Session cố định 8 giờ, role đọc từ DB; logout xóa registry/cookie. Không localStorage chứa token/password. Prisma client/adapter-pg cùng version 7.10.1; không PrismaAdapter vì Credentials không persist user qua adapter.

Rate limits PostgreSQL atomic: login 30/address/15 phút, 10/username/15 phút, register 5/address/giờ. Vercel chỉ tin header IP nền tảng ghi đè; ngoài Vercel dùng shared bucket. Self-host nhiều người cần trusted ingress contract riêng. Quản trị có thể dọn AuthSession/AuthRateLimit hết hạn trong vận hành; chưa có scheduler tự động.

UI giữ [DESIGN.md](DESIGN.md), Ant Design controls/Tailwind layout, tokens `src/lib/theme.ts`; AuthForm chung, keyboard password toggle, lỗi/loading, responsive. Dashboard chỉ là điểm đến được bảo vệ, chưa có dữ liệu nghiệp vụ.

`GET /api/health`: HTTP 200, no-store, `{ "status": "ok", "service": "ai-job-finder" }`.

## Vercel và Git

Vercel: Next.js, Node 24, install `npm ci`, build `npm run build`, output mặc định. Đặt NEXTAUTH_URL HTTPS, NEXTAUTH_SECRET, Neon pooled/direct env đúng Preview/Production. Migration/seed là bước quản trị riêng, không trong build. Không NODE_ENV=development hoặc admin default trên Production. Kiểm tra lại quotas/chính sách trước deploy; Hobby chỉ dùng cá nhân phi thương mại.

Người dùng tự quản lý GitHub/remote/commit/push. Agent không tự sửa remote hoặc commit. Secrets/build/dependencies/artifacts được ignore. Skill `ai-job-finder` đã xuất hiện trong danh sách skill của runtime phiên Giai đoạn 1.

Báo cáo: [Giai đoạn 0](docs/phase-0-report.md), [Giai đoạn 1](docs/phase-1-report.md). Giai đoạn 2 chỉ bắt đầu khi có yêu cầu mới.
