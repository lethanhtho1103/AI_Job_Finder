# AI Job Finder

Không gian tìm việc cá nhân bằng Next.js. **Hiện chỉ có Giai đoạn 0:** giao diện khởi đầu, theme, health endpoint, tooling, Prisma/Neon config và tài liệu. Chưa có đăng nhập, upload CV, tìm việc hoặc AI Matching.

Nguồn nghiệp vụ: [PRD Word](AI_Job_Finder_PRD_NextJS_Database_Roadmap_Codex_2026.docx). Đọc [implementation plan](docs/implementation-plan.md), [AGENTS.md](AGENTS.md) và [skill dự án](.agents/skills/ai-job-finder/SKILL.md) trước khi phát triển tiếp.

## Yêu cầu và cài đặt

- Node.js **24.x** và npm. `.nvmrc` ghi dòng Node; không cần cài lại Node nếu đã có.
- Cài dependencies bằng lock file:

```powershell
npm ci
npm run dev
```

Mở [localhost:3000](http://localhost:3000). Trang chủ và build chạy được khi chưa có `.env` hoặc dịch vụ cloud. Không có lệnh generate Prisma/migrate tự động lúc install/build.

## Các lệnh

| Lệnh                   | Chức năng                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Development server                                          |
| `npm run build`        | Production build                                            |
| `npm run start`        | Chạy production build đã có                                 |
| `npm run lint`         | ESLint                                                      |
| `npm run typecheck`    | TypeScript strict                                           |
| `npm run format:check` | Kiểm tra Prettier                                           |
| `npm run format`       | Format source/tài liệu                                      |
| `npm test`             | Vitest unit tests                                           |
| `npm run test:watch`   | Vitest watch                                                |
| `npm run test:e2e`     | Playwright production smoke desktop/mobile; cần build trước |
| `npm run db:validate`  | Validate schema Prisma, không kết nối DB                    |
| `npm run db:check`     | Neon SELECT 1, cần DATABASE_URL thật, timeout 10 giây       |

Cài Chromium để chạy E2E lần đầu:

```powershell
npx playwright install chromium
npm run build
npm run test:e2e
```

E2E tự mở production server tại `127.0.0.1:3100`, đóng sau kiểm tra, không tái sử dụng server khác. Ảnh chụp ở `test-results/`; trace giữ khi lỗi. Không commit artifacts. Đọc quy tắc quyền chạy app/build trong AGENTS.md khi dùng agent.

## Neon và biến môi trường

Chỉ cần Neon khi muốn kiểm tra kết nối hoặc phát triển auth/database ở phase sau:

```powershell
Copy-Item .env.example .env
```

Thay placeholder trong `.env` bằng connection strings lấy từ Neon:

| Biến           | Mục đích                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Pooled URL có hostname `*-pooler.neon.tech`, tài khoản/database và `sslmode=require`; dành cho runtime và db:check |
| `DIRECT_URL`   | Direct URL Neon cùng database, dành cho Prisma CLI/migrations                                                      |

CLI dùng dotenv đọc `.env`. Schema validation không cần URL; tác vụ kết nối/migration cần URL thực. Không đưa secrets vào `NEXT_PUBLIC_*`, source, log, Git hoặc ảnh chụp. `.env.example` có ví dụ và các biến tương lai ở dạng comment; chưa cần AI/email/storage trong phase 0.

```powershell
npm run db:validate
npm run db:check
```

`db:check` chỉ đọc `SELECT 1`, không tạo bảng. Không đưa raw error của provider vào output. Thiếu/sai credentials trả exit code 1; không chứng minh kết nối thành công từ schema validation. Công cụ này xác minh pooled URL; direct URL/migration được kiểm chứng khi triển khai schema thật.

`prisma/schema.prisma` hiện chỉ có datasource PostgreSQL. Chưa có generator, Prisma Client, model hoặc migration. Phase 1 sẽ generate schema Better Auth theo version thực, thêm client/driver adapter tương thích Prisma 7.10.1, singleton và migration đầu tiên. Không chạy `prisma generate` hoặc thêm bảng giả ở phase 0.

## Health endpoint

`GET /api/health` trả HTTP 200, `Cache-Control: no-store`:

```json
{ "status": "ok", "service": "ai-job-finder" }
```

Đây là liveness của ứng dụng, không kiểm tra Neon, AI, email hoặc storage.

## Kiến trúc source

`src/app` giữ pages/layouts và HTTP entrypoints mỏng; `src/components` chứa shared UI/layout; `src/lib` chứa theme/utilities; `src/server` dành cho server infrastructure; `prisma` dành cho schema; `tests` dành cho unit/E2E. Business modules sẽ được tạo trong `src/modules/<feature>` khi triển khai phase tương ứng. Không tạo trước các folder rỗng.

Ant Design quản lý components, Tailwind quản lý layout. [DESIGN.md](DESIGN.md) ghi visual contract; `src/lib/theme.ts` là nguồn token duy nhất, được dùng bởi ConfigProvider và CSS variables tại root layout. AntdRegistry phục vụ SSR styles. UI dùng tiếng Việt và font hệ thống, không tải font lúc build.

## Skill của repository

Skill nằm tại `.agents/skills/ai-job-finder/SKILL.md`, name `ai-job-finder`, automatic discovery theo mặc định. Mở repo root trong Codex, kiểm tra skill selector hoặc gọi `$ai-job-finder`. Nếu chưa xuất hiện, mở lại phiên/restart Codex theo tài liệu chính thức. YAML validation chỉ chứng minh định dạng; không chứng minh phiên hiện tại đã reload skill. Không cần cài global hoặc thay cấu hình cá nhân.

## Chuẩn bị Vercel

Phase 0 chỉ chuẩn bị source, chưa deploy. Khi được yêu cầu deploy:

1. Người dùng tự tạo GitHub repo, commit/push và kết nối Vercel.
2. Framework preset **Next.js**, Node.js **24.x**; install `npm ci`, build `npm run build`, để output mặc định.
3. Thêm biến môi trường cần thiết theo phase trong Vercel Settings, tách Preview/Production; không commit chúng.
4. Không chạy migrations trong build. Khi có schema thật, review/backup và chạy `prisma migrate deploy` riêng bằng direct URL.
5. Kiểm tra `/`, trang 404 và `/api/health` trên deployment thật. Local build không chứng minh đã deploy/kết nối cloud.

Vercel Hobby chỉ dùng cá nhân phi thương mại; kiểm tra lại điều khoản/quota trước deploy hoặc mở SaaS. Neon, storage, AI và email là dịch vụ ngoài. Không cần `vercel.json` vì cấu hình Next.js mặc định đáp ứng phase 0.

## Giai đoạn tiếp theo và Git

Phase 1: Better Auth email/password, email verification/reset, generated auth schema, session/owner guards, migrations thật và kiểm thử hai tài khoản. Chỉ bắt đầu khi có yêu cầu mới.

Git local đã khởi tạo; chưa có remote hoặc commit. `.gitignore` loại `.env*` (trừ `.env.example`), build output, dependencies và test artifacts. Người dùng tự commit/push. Commit message đề xuất: `chore: initialize AI Job Finder phase 0 foundation`.

Kết quả kiểm tra và giới hạn xác minh lần bàn giao tại [báo cáo Giai đoạn 0](docs/phase-0-report.md).
