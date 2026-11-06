# Quality checklist

- Kiểm tra yêu cầu hiện tại đã cho phép chạy app/build hay chưa; tôn trọng AGENTS.md. Lần triển khai Giai đoạn 0 và 1 đã có yêu cầu đầy đủ.
- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`.
- Khi được yêu cầu: `npm run build`, rồi `npm run test:e2e` (production server, desktop/mobile Chromium). Cài browser Playwright nếu môi trường chưa có.
- `npm run db:validate` chỉ validate schema; không chứng minh kết nối. `npm run db:check` chạy SELECT 1, cần pooled URL thật.
- Chạy test đúng phase: owner A/B, upload giả MIME/size, partial source failure, dedup, AI fallback/cache, idempotent Applied và snapshots khi các tính năng này được triển khai.
- Phase 1: hash, register/duplicates/case/password/role injection, login/logout/replay/expiry, seed idempotent, dev-only default và production guard. Auth E2E cần TEST_DATABASE_URL local riêng ai_job_finder_test, không dùng database thực của người dùng. Chạy dev cho default Admin, production build để kiểm tra default bị chặn; thiếu Neon credentials phải ghi rõ.
- UI: tiếng Việt, keyboard/focus, narrow viewport, không tràn ngang, giảm motion; loading/error/empty chỉ khi workflow có những trạng thái đó.
- Git status và ignored files; không secrets trong file bàn giao hoặc tracked files. Không commit/push.
- Skill: YAML name/description hợp lệ, references tồn tại. Validator đạt không có nghĩa runtime đã nhận diện; kiểm tra selector nếu môi trường cho phép, báo giới hạn nếu không.
- Báo rõ check nào đạt/thất bại/chưa chạy, nguyên nhân và cấu hình cần người dùng cung cấp. Không khẳng định cloud/deploy thành công từ local build.
