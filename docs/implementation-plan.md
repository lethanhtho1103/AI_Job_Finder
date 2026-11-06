# AI Job Finder — Implementation Plan

## 1. Nguồn, mục tiêu và phạm vi

Nguồn nghiệp vụ chính thức: [AI_Job_Finder_PRD_NextJS_Database_Roadmap_Codex_2026.docx](../AI_Job_Finder_PRD_NextJS_Database_Roadmap_Codex_2026.docx), phiên bản 2.0, ngày 06/11/2026. Đã đọc toàn bộ 16 chương, các bảng trong DOCX, 20 bảng MVP và 10 bảng mở rộng. Tài liệu này diễn giải kế hoạch triển khai, không thay thế PRD.

Sản phẩm giúp một người tìm việc quản lý CV, mô tả công việc mong muốn, đối chiếu JD, tự ứng tuyển và giữ lịch sử đáng tin cậy. Chuẩn bị ownership cho nhiều người dùng từ đầu, chưa triển khai organization/tenant.

MVP: auth email/password/verify/reset; hồ sơ và CV private; Search Profiles bằng ngôn ngữ tự nhiên và chỉnh tay; tìm theo yêu cầu qua nguồn hợp lệ hoặc nhập JD; hard filters + AI Matching có giải thích/fallback; danh sách tin, Saved/Skipped; mở Apply URL và xác nhận Applied; lịch sử/timeline; dashboard.

Ngoài MVP: scheduler, Daily Discovery, bot tự Apply/upload CV/gửi email, worker luôn bật, billing, multi-tenant administration. Không crawl nguồn bị cấm hoặc bypass CAPTCHA/OTP/rate limits. Không sample jobs production để coi như tích hợp thành công.

**Quyền triển khai hiện tại: chỉ Giai đoạn 0.** Nghiệm thu một phase không tự cho phép triển khai phase kế tiếp. UI/tài liệu bằng tiếng Việt, code/fields bằng tiếng Anh.

## 2. Kiến trúc và stack

Một repository, một Next.js app module-first triển khai Vercel. Next.js chứa UI và server entrypoints; Neon, private storage, email và AI là dịch vụ ngoài. Không microservices, monorepo hoặc generic repository/service base class.

| Lớp        | Quyết định                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------- |
| Runtime    | Node 24.x, npm, package-lock; local đã kiểm tra Node 24.22.2                                  |
| Web        | Next.js 16.4.5 App Router, React 19.3.1, TypeScript strict, alias @/                          |
| UI         | Ant Design 6.7, nextjs-registry cho SSR, CSS-in-JS layer; Tailwind 4 cho layout               |
| Validation | Zod tại biên API/form/AI; không dùng entity DB làm input contract                             |
| Database   | Neon PostgreSQL; Prisma 7.10.1 config ở phase 0; client/adapter đồng bộ ở phase 1             |
| Auth       | Better Auth + Prisma adapter thực tế; generate schema theo version đã chọn ở phase 1          |
| AI         | Vercel AI SDK; provider/model cấu hình server, ưu tiên quota miễn phí; lựa chọn trước phase 3 |
| CV         | Private object storage; chọn provider trước phase 2, signed URL và owner checks               |
| Tooling    | ESLint, Prettier, Vitest, Playwright và axe accessibility                                     |
| Hosting    | Cấu hình Next.js cho Vercel Node 24; deploy thật ở phase 7 theo yêu cầu                       |

Prisma 7 được pin vì Better Auth hiện chưa hỗ trợ client API Prisma 8. Không dùng `latest` cho Prisma. CLI/client/driver adapter phải cùng dòng tương thích khi bổ sung. Kiểm tra lại thư viện và chính sách cloud ở phase sử dụng, không coi quota/free tier là cam kết vĩnh viễn.

### Trách nhiệm source

```text
src/
  app/                 Pages/layouts/Route Handlers/Server Actions mỏng
  components/
    layout/            Shell dùng chung
    ui/                Provider và thành phần UI dùng chung
  lib/                 Tiện ích thuần, theme tokens
  server/db/           Cấu hình Neon hiện tại; Prisma singleton ở phase 1
  styles/              CSS global và Tailwind/theme mapping
scripts/               Tác vụ vận hành local, không nằm trong client bundle
prisma/                Schema; migrations chỉ khi có model thực
tests/unit/            Test invariant và contract
tests/e2e/             Smoke/luồng production
docs/                  Plan, báo cáo, quyết định khi có nhu cầu
.agents/skills/        Skill riêng cho repo
```

Các thư mục sau chỉ tạo khi có consumer thật:

- `src/modules/{auth,candidate,resumes,search-profiles,job-sources,job-search,ai-matching,applications,dashboard}`: UI/schema/DTO/service của từng tính năng.
- `src/server/{auth,ai,storage,integrations}`: cấu hình và adapter server. `src/server/db`: Prisma singleton và queries cụ thể; không truy vấn DB trong Client Components.
- Route groups `(public)` cho auth/landing và `(dashboard)` cho pages cần session ở phase 1 trở đi. Shared hooks/types chỉ tách khi được dùng thực sự; không `.gitkeep` hàng loạt.

Server Components mặc định; client boundary nhỏ cho provider/tương tác. Route Handlers cho HTTP, Server Actions cho mutation UI khi phù hợp; không nhân đôi API không cần thiết. Error API nghiệp vụ dùng `{ error: { code, message } }`, HTTP status đúng; không trả stack trace hoặc input nhạy cảm.

## 3. Database Architecture

### Quy ước và invariants

- Bốn auth models theo Better Auth generate thực tế. `User.id` và mọi `userId` dùng kiểu tương thích (String); business PK UUID. Không ép auth ID thành UUID.
- Models PascalCase, fields camelCase; nếu map SQL snake_case thì nhất quán toàn schema. DateTime UTC, business timestamps dùng timestamptz. Tiền dùng Decimal + currency + period, không float.
- JSONB cho criteria/AI breakdown/metadata mở rộng; tách cột thường lọc/index. Không soft-delete mọi bảng theo mặc định.
- Mọi truy cập dữ liệu cá nhân kiểm tra owner tại server, bao gồm các ID liên kết. Dữ liệu PUBLIC_SOURCE chỉ dùng chung theo quyền nguồn. PRIVATE_IMPORT có owner và không đi vào query/cache/dedup của user khác.
- Unique/index/check constraints phải nằm trong DB, không chỉ kiểm tra UI. SQL migration bổ sung partial index/check khi Prisma chưa biểu diễn đủ.
- Không cascade xóa application theo JD/CV; giữ snapshots và quan hệ phù hợp. Không tạo schema của phase tương lai sớm.

### Phân bổ 20 bảng MVP

Đây là bản đồ triển khai. Khi làm từng phase phải đọc lại đầy đủ fields/types/FK trong chương 7 PRD và đối chiếu schema thực tế.

| Bảng                     | Phase | Quan hệ, dữ liệu và constraints chính                                                                                                                                                       |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User                     | 1     | Auth String PK; email unique; không nhét hồ sơ tuyển dụng vào auth user                                                                                                                     |
| Session                  | 1     | FK userId, token unique, expiresAt; index userId; theo generator                                                                                                                            |
| Account                  | 1     | FK userId, provider/account, password hash thư viện quản lý; theo adapter                                                                                                                   |
| Verification             | 1     | Identifier/value/expiry theo generator; không log token                                                                                                                                     |
| CandidateProfile         | 2     | UUID; userId unique (1:1 User); contact, experience, salary, links                                                                                                                          |
| CandidateSkill           | 2     | FK userId/profileId cùng owner; unique(profileId, normalizedName), index userId                                                                                                             |
| CandidateResume          | 2     | FK user/profile; objectKey, MIME/size/SHA256/version/default; index(userId, uploadedAt), unique(userId, sha256, version); review partial unique default                                     |
| ResumeAnalysis           | 2     | FK user/resume; extracted/parsed data, content hash, parser/model/status/approval; index(resumeId, createdAt), cache key version                                                            |
| SearchProfile            | 3     | FK user/resume cùng owner; criteria JSON/version, minimumScore, unknownSalaryPolicy; index(userId, updatedAt), check score 0–100                                                            |
| SearchProfileSource      | 3     | FK profile/source; unique(searchProfileId, sourceId), indexes FK                                                                                                                            |
| JobSource                | 3     | Code unique, URL, mode, policy/reference/review date; index(isEnabled, searchMode); mặc định UNKNOWN                                                                                        |
| AiUsageLog               | 3     | FK user nullable; operation/provider/model/status/token counts/duration/errorCode; indexes user/date và operation/date; không raw payload                                                   |
| JobPosting               | 4     | FK source, owner nullable theo visibility; source IDs/URL/JD/hash/salary/location/status; partial unique source+external ID, sourceScopedKey; index(companyName, title, lastSeenAt)         |
| SearchExecution          | 4     | FK user/profile; MANUAL trigger, criteria snapshot, status/counters/times/errors; indexes user/date và profile/date                                                                         |
| SearchExecutionItem      | 4     | FK execution/job/source; unique(executionId, jobPostingId), index jobPostingId; rank/status                                                                                                 |
| JobSourceEvent           | 4     | FK source/execution/user; type/status/error/date; indexes source/date, execution; redact logs                                                                                               |
| JobMatch                 | 5     | FK user/profile/job/resume/analysis cùng owner khi cá nhân; score/filter/breakdown/fingerprint/model; unique(userId, searchProfileId, jobPostingId, inputFingerprint), index(userId, score) |
| UserJob                  | 6     | FK user/job; personal status/notes/times; unique(userId, jobPostingId), index(userId, status)                                                                                               |
| JobApplication           | 6     | FK user/job/resume; MANUAL/USER_REPORTED; appliedAt, status, snapshots; unique(userId, jobPostingId), indexes user/date desc và user/status                                                 |
| ApplicationStatusHistory | 6     | FK application/user; from/to/source/note/time; indexes application/date và user/date; chỉ ghi khi thay đổi                                                                                  |

Quan hệ: User 1:1 Profile, 1:N CV/SearchProfile/UserJob/Application; Resume 1:N Analysis; SearchProfile N:M Source; Source 1:N Posting; SearchProfile 1:N Execution; Execution N:M Posting; Matching phụ thuộc user/profile/resume/JD; Application 1:N StatusHistory.

### Kết nối và migrations

- Runtime: `DATABASE_URL` pooled Neon. Prisma CLI: `DIRECT_URL` direct qua `prisma.config.ts`.
- Phase 0: datasource PostgreSQL không model/generator/client; không migration, seed hoặc bảng giả. `db:validate` không cần credentials. `db:check` dùng Neon driver SELECT 1, timeout 10 giây và lỗi đã loại thông tin kết nối.
- Phase 1: generate Better Auth schema → review → thêm generator/client/adapter → migration thật đầu tiên → Prisma singleton server. Không để `@prisma/client` chưa generate được import trong phase 0.
- Dev migration trên branch/database phù hợp. Production dùng `prisma migrate deploy` trong bước kiểm soát sau review/backup; không migrate trong build hoặc `db push` production.

## 4. Authentication, CV và AI Architecture

### Authentication

Phase 1 triển khai Better Auth email/password, verify/resend, forgot/reset/change password, login/logout, quản lý session và protected layouts. Generator/adapter thực tế quyết định auth schema. Cookie HttpOnly/Secure/SameSite phù hợp HTTPS, rate limits cho luồng nhạy cảm; server lấy userId từ session. Test quyền với hai người dùng, không chỉ chặn route ở client. Email dev và provider thật được cấu hình trước nghiệm thu auth; không công bố gửi mail thành công khi chỉ log local.

### Candidate và CV

Profile tách auth account. Upload PDF/DOCX vào private storage, validate magic bytes/MIME/size; lưu metadata/checksum/version, tải qua signed URL ngắn hạn sau owner check. Extract text server bằng thư viện PDF/DOCX; người dùng kiểm tra và xác nhận trước coi là dữ liệu tin cậy. Không đưa binary vào PostgreSQL/Git. Retention, xóa file và snapshot lịch sử phải được chốt trước các thao tác xóa.

### AI

- Vercel AI SDK và cấu hình provider/model phía server; adapter đơn giản cho provider được dùng thật, không framework nhiều tầng.
- Search parser chuyển mô tả thành JSON Zod, có schema version; người dùng sửa/duyệt trước lưu. Khi AI lỗi vẫn nhập tiêu chí thủ công.
- Resume parser extract text bằng thư viện trước; AI chỉ chuẩn hóa khi được phép. Không truyền CV/PII sang bên thứ ba khi chưa giải thích và có chấp thuận.
- Matching: hard filters xác định trước; chỉ gọi LLM cho JD đủ điều kiện. Output score 0–100, matching/missing skills, reason và analysis status; không coi điểm là xác suất nhận việc.
- Cache fingerprint gồm JD hash, CV/analysis revision, criteria revision và model/prompt version; không gọi AI mỗi render. Cache cá nhân luôn theo owner.
- Timeout/quota/batch giới hạn; AI lỗi hiển thị chưa phân tích, giữ hard filter results. JD là dữ liệu không tin cậy, không thực thi chỉ dẫn trong JD. Telemetry chỉ metadata an toàn.

## 5. Job Search Engine và Manual Apply

### Discovery

Adapter khai báo capabilities Search/Detail/ManualOpen và chính sách. Chỉ nguồn được phép mới chạy request search/detail; không suy quyền từ việc fetch được HTML. Nguồn mặc định UNKNOWN; không bypass bảo vệ. Kiểm tra URL/domain/IP và redirect để chặn SSRF khi nhập URL.

Người dùng bấm tìm → snapshot criteria → chạy các nguồn có quyền, giới hạn thời lượng/số tin → normalize/upsert → ghi items/events → hard filter → matching ở phase 5. Một nguồn lỗi giữ kết quả nguồn khác, Execution PARTIAL. Nếu chưa có nguồn tự động hợp lệ, hỗ trợ dán JD/link, đánh dấu PRIVATE_IMPORT và owner; không giả dữ liệu để nghiệm thu nguồn thật.

Dedup trong nguồn ưu tiên externalJobId; fallback URL chuẩn hóa/sourceScopedKey ổn định. Khác nguồn không gộp chỉ vì title/company trùng. Import riêng phải namespace key theo owner. Lương không rõ không bằng 0; chỉ so cùng currency/period, không suy net từ gross. Remote/Hybrid tách nơi làm việc với điều kiện cư trú. Listing EXPIRED chỉ khi có tín hiệu tin cậy.

### Manual Apply và history

Mở Apply URL chỉ ghi sự kiện mở/view, không tạo application. Người dùng tự nộp bên ngoài rồi xác nhận đã ứng tuyển và CV dùng thực tế. Server transaction/upsert unique(userId, jobPostingId), tạo application MANUAL/USER_REPORTED và history đầu tiên nguyên tử. Double click/mất kết nối/retry không tạo trùng.

JobApplication status tách UserJob status; tin Applied vẫn có thể Saved. Khi tìm lại, join trạng thái theo user, ưu tiên badge Applied và tùy chọn ẩn khỏi shortlist. Lưu snapshots JD/company/URL/CV/score; không mất history khi JD/CV bị sửa/xóa. Timeline không ghi trùng khi status không đổi. Các chuyển trạng thái cụ thể cần chốt trước phase 6, không tự suy từ danh sách enum.

## 6. Security, UI và deployment

- Session/owner check tại server cho mọi dữ liệu cá nhân và ID liên kết; admin không có quyền CV mặc định. Test A/B và PRIVATE_IMPORT.
- Private storage, signed URLs ngắn hạn, upload validation; rate limit auth/parse/search/matching. SSRF protection, sanitize JD, chống prompt injection.
- Secrets chỉ server env, không `NEXT_PUBLIC_` cho keys; không raw CV/JD/prompt/cookies trong logs. Thời gian lưu/xóa/export/backup được quyết định trước feature tương ứng.
- Ant Design components, Tailwind layout; canonical tokens `src/lib/theme.ts` → inline CSS variables/Ant Design theme → Tailwind aliases/global CSS. Chi tiết tại [DESIGN.md](../DESIGN.md).
- Trang phase 0 dùng copy sản phẩm trung thực, không dashboard fake. Responsive, semantic HTML, keyboard focus, reduced motion và scrollbar dùng được. UI workflow phức tạp chỉ phát triển khi đến phase.
- Public health GET `/api/health`: 200, JSON `{ "status": "ok", "service": "ai-job-finder" }`, Cache-Control no-store. Chỉ liveness, không DB ping, phiên bản hoặc secrets.
- Build/trang chủ không phụ thuộc credentials. Vercel chọn framework Next.js, Node 24, `npm ci`/`npm run build`, không output directory tùy chỉnh hoặc static export. Không tạo deployment ở phase 0.
- Hobby dùng cá nhân phi thương mại; trước SaaS kiểm tra lại gói thương mại, giới hạn Functions/Neon/storage/AI/email. Không chạy PostgreSQL/Ollama dài hạn trong Vercel Functions.

## 7. Roadmap Giai đoạn 0–7

### Giai đoạn 0 — Nền tảng (phạm vi hiện tại)

| Mục                  | Nội dung                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Repo Next.js sạch, chạy được, sẵn sàng phát triển theo phase                                                                                         |
| Nghiệp vụ            | Trang khởi đầu giới thiệu hành trình; chưa có auth hoặc dữ liệu tuyển dụng                                                                           |
| Database             | Prisma PostgreSQL config; pooled/direct env; không model/migration                                                                                   |
| API/UI               | `/`, 404, error boundary, shared shell/theme; GET `/api/health`; CLI `db:check`                                                                      |
| Dependencies         | Next/React/Antd/Tailwind/Zod/Neon driver; Prisma CLI, ESLint/Prettier/Vitest/Playwright                                                              |
| Công việc            | Git init, docs/AGENTS/skill, configs/env/README, theme/layout, health, test setup                                                                    |
| Testing              | Format/lint/typecheck/unit/build; production smoke desktop/mobile, axe/keyboard/SSR/no hydration errors; schema validate; DB ping nếu có credentials |
| Nghiệm thu           | Local checks đạt, app không cần dịch vụ ngoài, tài liệu/skill hợp lệ; không nghiệp vụ phase 1+; không commit/push                                    |
| Rủi ro/chưa xác minh | Neon thật và Vercel deploy cần credentials; runtime skill discovery có thể không có UI kiểm tra; build không chứng minh cloud                        |

### Giai đoạn 1 — Authentication (chưa triển khai)

| Mục                  | Nội dung                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Tài khoản và phiên đăng nhập an toàn                                                                           |
| Nghiệp vụ            | Signup/verify/resend/login/logout/forgot/reset/change password, profile auth và session                        |
| Database             | User/Session/Account/Verification theo Better Auth generate; migration thật đầu tiên                           |
| API/UI               | Better Auth handler `/api/auth/[...all]`; auth forms, protected layout, account page                           |
| Dependencies         | Better Auth, Prisma adapter/client/driver adapter tương thích; email dev và provider thật                      |
| Công việc            | Chọn version/email, generate schema, review migration, singleton, cookie/session/rate limit, server guards     |
| Testing              | Signup/verify/reset/invalid password/session expiry/logout; hai tài khoản A/B; không rò account/token          |
| Nghiệm thu           | Các luồng auth thật hoạt động; server chặn truy cập trái phép; email đã kiểm chứng theo môi trường             |
| Rủi ro/chưa xác minh | Khả năng gửi email, quotas/domain, adapter/version, deletion/retention account cần quyết định trước triển khai |

### Giai đoạn 2 — Candidate và CV (chưa triển khai)

| Mục                  | Nội dung                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Hồ sơ và CV riêng tư có nội dung được xác nhận                                                                        |
| Nghiệp vụ            | Sửa profile/skills; upload nhiều CV, chọn mặc định, preview/download, extract và duyệt                                |
| Database             | CandidateProfile, CandidateSkill, CandidateResume, ResumeAnalysis; FK/owner/default/checksum/version                  |
| API/UI               | Profile form; CV list/upload/detail/review; server actions và upload/download handlers có session                     |
| Dependencies         | Private storage adapter thực tế; PDF/DOCX extractor tương thích Node/serverless                                       |
| Công việc            | Chọn storage/limits/retention, private upload, magic-byte validation, signed URL, default transaction, parse approval |
| Testing              | Hai CV, đổi mặc định, owner A/B, MIME giả/quá size/hỏng file, signed URL và deletion không mất metadata               |
| Nghiệm thu           | File private, không public URL cố định, kỹ năng chưa duyệt không thành dữ kiện chắc chắn                              |
| Rủi ro/chưa xác minh | Storage free tier, parser timeout/bộ nhớ, encrypted/scanned PDF, consent/retention và CV snapshot                     |

### Giai đoạn 3 — Search Profiles (chưa triển khai)

| Mục                  | Nội dung                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Tiêu chí tìm việc có cấu trúc, sửa và tái sử dụng được                                                              |
| Nghiệp vụ            | Nhập mô tả, AI parse, duyệt/chỉnh tay, chọn CV/nguồn, lưu version                                                   |
| Database             | SearchProfile, SearchProfileSource, JobSource, AiUsageLog; score check, owner và source policy                      |
| API/UI               | Profile list/create/edit; parse action, criteria review, CV/source selector; manual fallback                        |
| Dependencies         | Vercel AI SDK, provider có structured output/quota phù hợp; Zod schemas                                             |
| Công việc            | Chọn provider/model và consent, define criteria schema/version, policy catalog, validation, timeout/rate limit/logs |
| Testing              | AI output sai/quota/timeout, manual editing, owner liên kết CV, score limits, nguồn không được phép                 |
| Nghiệm thu           | Criteria validate, lưu/sửa/tái dùng; AI hỏng không chặn tạo cấu hình; không cron/autoApply field                    |
| Rủi ro/chưa xác minh | Free tier/data retention AI, tên policy không thống nhất trong PRD, catalog thật chưa được xác minh                 |

### Giai đoạn 4 — Job Discovery (chưa triển khai)

| Mục                  | Nội dung                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Tin thật từ nguồn hợp lệ, normalize và chống trùng                                                             |
| Nghiệp vụ            | Tìm khi bấm nút, partial results, dán JD/link riêng; xem danh sách và JD                                       |
| Database             | JobPosting, SearchExecution, SearchExecutionItem, JobSourceEvent; partial uniques/indexes, private owner       |
| API/UI               | Search action/endpoint, execution status/detail, paginated job list/detail, manual import form                 |
| Dependencies         | Adapter API/feed có quyền, URL parser/sanitizer; chưa thêm crawler/queue mặc định                              |
| Công việc            | Xác minh quyền nguồn, giới hạn requests/JD/time, normalize/upsert/dedup, snapshots/events, SSRF protection     |
| Testing              | Một nguồn lỗi/một thành công/một bị cấm; cùng ID khác URL; title giống khác nguồn; private imports giữa users  |
| Nghiệm thu           | Tin thật truy vết được, chạy lại không trùng; PARTIAL giữ kết quả; import riêng không lộ; quyền nguồn rõ       |
| Rủi ro/chưa xác minh | Nguồn/quota/license, function timeout, key của private import và mâu thuẫn tiêu chí nguồn thật/manual fallback |

### Giai đoạn 5 — AI Matching (chưa triển khai)

| Mục                  | Nội dung                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Shortlist phù hợp có giải thích và fallback                                                                           |
| Nghiệp vụ            | Hard filters, score/reason/skills, xem chưa phân tích khi AI lỗi                                                      |
| Database             | JobMatch và AiUsageLog; input fingerprint/revisions, unique cache key, score 0–100                                    |
| API/UI               | Matching service/action, score filter/sort và explanation detail; paginated results                                   |
| Dependencies         | AI SDK/provider đã chọn; Zod output schemas; pure filter utilities                                                    |
| Công việc            | Salary/location/skills rules, unknown policy, minimal inputs, injection guard, versioned prompts/cache, quotas        |
| Testing              | Sai lương/khu vực, unknown salary/currency/period, CV chưa duyệt, invalid AI output/timeout, cache invalidation/owner |
| Nghiệm thu           | Hard filter xác định đúng, reason hợp lệ, AI lỗi vẫn dùng tin, đổi CV/criteria/JD/model không dùng cache cũ           |
| Rủi ro/chưa xác minh | Chất lượng/calibration điểm, AI quota/PII consent, thời lượng batch; không cam kết kết quả tuyển dụng                 |

### Giai đoạn 6 — Manual Apply và History (chưa triển khai)

| Mục                  | Nội dung                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | Lịch sử cá nhân đáng tin cậy và chống nộp trùng                                                                        |
| Nghiệp vụ            | Saved/Skipped/Hidden; mở link, tự nộp, xác nhận Applied, chọn CV/ngày, cập nhật trạng thái/ghi chú                     |
| Database             | UserJob, JobApplication, ApplicationStatusHistory; transaction/unique và snapshots                                     |
| API/UI               | Open link action/event, confirmation modal, idempotent Mark Applied, application list/detail/timeline                  |
| Dependencies         | Prisma transactions, Ant Design dialog/table/forms; không automation SDK                                               |
| Công việc            | Chốt state transitions/snapshot fields, owner checks, atomic create/history, join badge, giữ lịch sử qua deletion      |
| Testing              | Mở link không Applied; double-submit đồng thời/retry; tìm lại; status không đổi không log thêm; xóa CV/JD giữ snapshot |
| Nghiệm thu           | Một application/user/job, USER_REPORTED rõ, timeline đúng; UI không giả website đã xác minh                            |
| Rủi ro/chưa xác minh | PRD thiếu đủ snapshot fields và nơi lưu open event; người dùng tự khai báo, policy sửa sai/xóa history cần chốt        |

### Giai đoạn 7 — Dashboard, QA và Vercel (chưa triển khai)

| Mục                  | Nội dung                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu             | MVP dùng thật, triển khai và vận hành được trong quota                                                              |
| Nghiệp vụ            | Thống kê tin/saved/applied/interview, top source/recent execution; account/timezone/settings                        |
| Database             | Tổng hợp bảng đã có, tối ưu index/query khi đo được; không tạo bảng SaaS                                            |
| API/UI               | Dashboard/settings, paginated queries, thống kê theo user và timezone; feedback lỗi/quota                           |
| Dependencies         | Vercel + Neon + storage + AI + email, logging an toàn, E2E/accessibility tooling                                    |
| Công việc            | Test end-to-end thật, responsive/performance/security, backup/runbook, env/provisioning, controlled deploy          |
| Testing              | A/B ownership, full flow CV→search→match→manual Applied→history; function timeout/quota, timezone, production smoke |
| Nghiệm thu           | Deployment thật có bằng chứng, privacy và quotas được kiểm tra; README vận hành/giới hạn đầy đủ                     |
| Rủi ro/chưa xác minh | Cloud credentials, gói/quota thời điểm deploy, storage/email/AI policy, commercial use của hosting                  |

## 8. Điểm PRD cần giải quyết đúng thời điểm

Không tự mở rộng schema ở phase 0 để sửa các điểm sau:

1. Chương 4 dùng POLICY_UNKNOWN/MANUAL_SEARCH_ONLY; dictionary dùng UNKNOWN/MANUAL_ONLY. Trước phase 3 thống nhất persistence/UI mapping, giữ UNKNOWN là không được tự động quét.
2. Resume/JD snapshots được yêu cầu ở nghiệp vụ nhưng JobApplication dictionary chưa đủ trường. Trước phase 6 xác định payload/version/retention, không chỉ title/company/URL.
3. `SearchExecution.completedAt` mô tả DateTime trong khi RUNNING chưa hoàn tất; nullable trước khi hoàn thành. QUEUED chỉ dùng khi có queue thật.
4. Chỉ số thành công đòi ít nhất một nguồn thật được phép; phase 4 lại cho manual fallback. Manual import có thể nghiệm thu khả năng nhập, không được báo đã hoàn thành tích hợp nguồn thật.
5. PRIVATE_IMPORT cần namespace dedup theo owner; FK một chiều không tự bảo đảm CV/profile/application cùng chủ. Thực thi và test khi tạo bảng liên quan.
6. Nơi ghi sự kiện mở URL và chính sách thay đổi/xóa trạng thái chưa đầy đủ trong dictionary. Chốt trước phase 6; không tạo application để thay thế event.

## 9. Mở rộng sau MVP — chỉ định hướng

- **A — Daily Discovery:** AutomationSchedule, AutomationExecution, Notification; chỉ bắt đầu khi tìm thủ công có hiệu quả và đã kiểm tra platform/quota. Bounded retries, lease/idempotency; chọn cron/queue/worker theo nhu cầu đo được.
- **B — Auto Apply:** JobSourceConnection, ApplicationAttempt; cần quyền submit thực, sandbox và xác minh kết quả ngoài hệ thống. Trạng thái UNKNOWN khi kết quả không chắc chắn; không báo Applied chỉ vì bấm nút. Credential reference/vault, không cookie thô.
- **C — SaaS:** SubscriptionPlan, UserSubscription, UsageLedger, Organization, OrganizationMember khi thực sự cần; hosting thương mại, quota/billing/observability. Tenant membership bổ sung, không bỏ owner checks.

Không tạo migration, CRUD, API hoặc adapter giả cho 10 bảng tương lai trên trong MVP.

## 10. Kiểm tra và bàn giao phase 0

Yêu cầu triển khai lần này cho phép cài dependencies, lint/typecheck/test/build và chạy production server để kiểm tra. Những lần sửa sau tuân thủ quyền trong yêu cầu mới và AGENTS.md.

1. `npm install` tạo lock; sau đó `npm ci` cho môi trường tái lập.
2. `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`.
3. `npm run db:validate`; `npm run db:check` khi có Neon thật; ghi rõ trường hợp thiếu credentials.
4. `npm run build` rồi `npm run test:e2e`: production server, desktop/mobile, home/404/health, keyboard/axe, CSS SSR, hydration/console, overflow/reduced motion.
5. Validate skill/frontmatter/references, kiểm tra discovery khi có runtime UI; không suy từ validator. Kiểm tra DESIGN/token mapping và UI audit phù hợp màn hình đơn giản hiện tại.
6. Git status/ignore/secrets; không commit/push/deploy. Báo kết quả, cấu hình thiếu và phase 1 đề xuất.

Commit message đề xuất: `chore: initialize AI Job Finder phase 0 foundation`.

## 11. Nguồn kỹ thuật

- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma) — tương thích Prisma 7 và schema thực tế.
- [Prisma 7 config](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference) — cấu hình CLI/datasource.
- [Ant Design Next.js](https://ant.design/docs/react/use-with-next/) và [CSS layers](https://ant.design/docs/react/compatible-style/) — SSR/styles.
- [Codex local skills](https://learn.chatgpt.com/docs/build-skills) — discovery và frontmatter.
- [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Hobby](https://vercel.com/docs/plans/hobby) — kiểm tra lại trước deploy.
