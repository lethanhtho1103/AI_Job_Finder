# Phase workflow

Nguồn: PRD chương 12 và `docs/implementation-plan.md`.

| Phase | Phạm vi                                                    | Điều kiện chuyển                                       |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 0     | Next.js, theme, tooling, Prisma config, docs/skill, health | Checks nền tảng đạt; cần yêu cầu mới để làm phase 1    |
| 1     | Better Auth, verify/reset, session/owner checks            | Luồng auth và phân quyền được kiểm thử                 |
| 2     | Candidate/CV, private upload, parse và duyệt               | CV private, nhiều phiên bản, default CV đúng           |
| 3     | Search Profile, nguồn, AI parse/manual                     | Criteria validate, sửa và tái sử dụng được             |
| 4     | Discovery, authorized adapters, manual import, dedup       | Tin thật; quyền nguồn rõ; không trùng hoặc lộ JD riêng |
| 5     | Hard filters, AI Matching, cache                           | Lỗi AI có fallback; version invalidation đúng          |
| 6     | Manual Apply, UserJob, history                             | Open link không Applied; double-submit idempotent      |
| 7     | Dashboard, QA, deployment                                  | End-to-end thật và privacy/quota đúng                  |

Mỗi yêu cầu: xác định phase → đọc PRD/plan/schema liên quan → triển khai đúng phần được yêu cầu → xác minh → báo cáo. Gate nghiệm thu không tự cấp quyền làm phase sau.

Daily Discovery, Auto Apply, SaaS thuộc tương lai A/B/C. Không tạo bảng/API/CRUD của chúng trước yêu cầu rõ ràng. Provider/email/storage/job source chưa chốt ở phase 0 được quyết định trước phase sử dụng, không âm thầm giả lập.
