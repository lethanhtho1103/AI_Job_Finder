# AI Job Finder — Quy tắc repository

## Nguồn sự thật và phạm vi

- Đọc toàn bộ [PRD Word](AI_Job_Finder_PRD_NextJS_Database_Roadmap_Codex_2026.docx) trước khi triển khai nghiệp vụ; nếu không đọc được, báo rõ, không suy đoán.
- Đọc [implementation plan](docs/implementation-plan.md) và dùng skill [ai-job-finder](.agents/skills/ai-job-finder/SKILL.md).
- Hiện chỉ hoàn thành Giai đoạn 0. Chỉ triển khai giai đoạn/tính năng người dùng yêu cầu; không tự chuyển giai đoạn.
- MVP tìm việc theo yêu cầu và Apply thủ công. Không scheduler, bot Apply, billing hoặc tenant trong MVP.

## Code và kiến trúc

- Ưu tiên code đơn giản, explicit, dễ đọc; giữ function tập trung. Không over-engineer, abstraction chỉ khi được dùng lại hoặc cải thiện bảo trì rõ ràng.
- Theo cấu trúc, naming và conventions hiện có; không refactor ngoài yêu cầu, không tạo file/layer dư thừa; tái dùng helper trước khi tạo mới.
- TypeScript strict, không `any` tùy tiện; đặt tên tiếng Anh. UI, tài liệu, lỗi hướng người dùng bằng tiếng Việt, UTF-8.
- `src/app`: route, layout và entrypoint mỏng. `src/modules/<feature>`: UI/schema/service theo tính năng. `src/server`: DB, auth, AI, storage, integrations. `src/lib`: tiện ích thuần và theme.
- Mặc định Server Components; chỉ dùng Client Components khi cần tương tác/provider. Không Prisma, keys hoặc logic bảo mật trong client bundle; dùng `server-only` cho module runtime server khi bổ sung.
- Một ứng dụng Next.js, không microservices, monorepo hoặc generic repository/service layer khi chưa cần.

## Database và bảo mật

- Prisma 7; giữ CLI/client/adapter tương thích. Không generate client khi schema chưa có model; không tạo model giả để vượt kiểm tra.
- Better Auth sinh schema chính thức theo phiên bản thực tế; không tự áp schema auth từ dictionary logic. Business IDs UUID; `userId` String tương thích auth.
- Models PascalCase, fields camelCase; UTC/timestamptz cho thời gian, Decimal + currency + period cho tiền. FK, unique và indexes theo PRD.
- Runtime dùng `DATABASE_URL` pooled; migrations dùng `DIRECT_URL`. Không migration lúc build, không `db push` production. Review migration, backup/rollback trước thay đổi dữ liệu.
- Xác thực session và ownership phía server cho mọi query/mutation cá nhân; không tin `userId` do client gửi. Admin không mặc nhiên được đọc CV.
- CV private, signed URL ngắn hạn; validate MIME/magic bytes/size. Chặn SSRF khi fetch URL; sanitize JD. Không vượt CAPTCHA/OTP, rate limit hoặc chính sách nguồn.
- Không log CV, prompt thô, tokens hoặc credentials; không commit secrets. Chỉ gửi dữ liệu sang AI sau giải thích/chấp thuận theo nghiệp vụ.
- Mở Apply URL không tạo Applied. Mark Applied phải idempotent, transaction/unique(userId, jobPostingId); giữ lịch sử và snapshots khi CV/JD thay đổi hoặc bị xóa.

## API, validation và lỗi

- Validate input và AI output bằng Zod tại biên; schema API khác entity DB. Kiểm tra quyền trước trả dữ liệu.
- Route Handlers cho HTTP endpoint; Server Actions cho mutation UI khi phù hợp. Không tạo hai đường ghi cho cùng nghiệp vụ nếu không cần.
- Khi có API nghiệp vụ: response lỗi `{ error: { code, message } }`, HTTP status đúng; không stack trace/PII. Dùng lỗi có kiểu hoặc result rõ ràng, không swallow lỗi làm giả thành công.
- Health hiện tại là liveness, không chứng minh kết nối DB/dịch vụ ngoài.

## UI và chất lượng

- Đọc [DESIGN.md](DESIGN.md). Token runtime tại `src/lib/theme.ts`; Ant Design cho controls, Tailwind cho layout. Không nhân đôi giá trị theme.
- UI có semantic HTML, keyboard/focus, responsive; xử lý loading/empty/error theo tính năng thực. Không dữ liệu giả production, không nút/link không hoạt động.
- Không chạy ứng dụng/build sau sửa đổi trừ khi người dùng yêu cầu rõ. Nếu yêu cầu hiện tại đã bao gồm kiểm thử/build, thực hiện đầy đủ mà không xin lại.
- Lệnh: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`; `npm run build`, rồi `npm run test:e2e` khi được yêu cầu. E2E dùng production build.
- DB: `npm run db:validate`; `npm run db:check` chỉ đọc, cần credentials. Báo riêng kết quả thực và phần bị chặn bởi dịch vụ ngoài.
- Test invariant/nghiệp vụ, không chỉ lặp lại implementation; không thêm test dư cho sửa đổi hình thức nhỏ.

## Git và bàn giao

- Git local đã khởi tạo. Người dùng tự tạo GitHub repo, commit và push. Không tự remote/commit/push.
- Không ghi đè thay đổi người dùng hoặc chạy Git destructive. Kiểm tra status và ignore rules trước bàn giao.
- Báo thay đổi, kiểm tra thực tế, giới hạn xác minh, cấu hình cần bổ sung và commit message đề xuất. Không tuyên bố deploy/DB/skill discovery thành công khi chưa có bằng chứng.
