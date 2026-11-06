---
name: ai-job-finder
description: Phát triển hoặc review AI Job Finder trong repository này theo PRD, roadmap và quy tắc ownership. Dùng khi sửa nền tảng, auth, CV, tìm việc, AI matching hoặc lịch sử ứng tuyển của dự án.
---

# AI Job Finder

## Chuẩn bị

1. Xác định repository root, đọc `AGENTS.md` và toàn bộ `AI_Job_Finder_PRD_NextJS_Database_Roadmap_Codex_2026.docx` tại root. DOCX chứa bảng: đọc cả văn bản trong ô, không chỉ headings. Nếu không đọc đầy đủ được, báo giới hạn; không đoán nghiệp vụ.
2. Đọc `docs/implementation-plan.md`; đối chiếu yêu cầu hiện tại với [phase workflow](references/phase-workflow.md). Xác định giai đoạn được phép, không tự triển khai giai đoạn kế tiếp.
3. Đọc nghiệp vụ liên quan trong PRD và [business rules](references/business-rules.md). Nếu có xung đột chưa giải quyết, nêu rõ trước khi triển khai hành vi phụ thuộc.

Giai đoạn 1 đã được người dùng điều chỉnh thành username/password-only. Đọc `docs/phase-1-authentication.md` trước khi sửa auth: dùng NextAuth Credentials, không email giả, không phục hồi Better Auth/email flows từ PRD cũ. Seed mặc định chỉ Development local; không tự đổi password/role account hiện hữu.

## Triển khai

4. Kiểm tra schema/migrations hiện có, FK/unique/index và owner của mọi đầu vào; dùng [database guidelines](references/database-guidelines.md). Không tạo bảng chỉ vì đã có trong PRD.
5. Xác định module, đọc conventions và [architecture](references/architecture.md); với UI đọc `DESIGN.md`. Dùng implementation đơn giản, tái dùng code hiện có.
6. Sửa đúng phạm vi, kiểm tra session, ownership, private CV, input/AI validation và log không chứa secrets. Không làm giả tích hợp nguồn hoặc kết quả AI.

## Xác minh và bàn giao

7. Theo [quality checklist](references/quality-checklist.md), chạy lint/typecheck/test/build theo quyền đã có trong yêu cầu hiện tại. Quy tắc của người dùng: không tự chạy app/build sau sửa đổi nếu chưa được yêu cầu. Không xin lại nếu yêu cầu đã bao gồm chúng.
8. Báo file thay đổi, kiểm tra thực tế và giới hạn (credentials, provider, deployment, runtime discovery). Đề xuất commit message; không tự commit/push/remote.

Các đường dẫn `AGENTS.md`, `docs/...`, `prisma/...` trong skill được tính từ repository root. Các reference được tính từ thư mục skill. Reference chỉ tóm tắt nguyên tắc; PRD gốc vẫn là nguồn nghiệp vụ chính thức.
