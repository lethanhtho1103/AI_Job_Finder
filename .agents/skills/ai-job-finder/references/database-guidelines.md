# Database guidelines

Nguồn: PRD chương 6–9; kiểm tra schema thực trước mỗi thay đổi.

- Auth đã được người dùng điều chỉnh ở phase 1: NextAuth 4 Credentials + JWT, không email. Đọc `docs/phase-1-authentication.md`; không tạo schema Better Auth/Account/Verification hoặc email giả. PrismaAdapter không dùng cho Credentials JWT.
- Auth models thực: User, AuthSession (registry thu hồi JWT), AuthRateLimit (atomic PostgreSQL counters). User.id String @db.Uuid, FK userId cùng kiểu. UsernameKey lowercase unique/check; role User mặc định, không cho client chọn quyền. Seed Admin không reset/nâng quyền account hiện hữu.
- Business UUID, userId String tương thích User.id; model PascalCase, field camelCase. Thống nhất mapping nếu dùng SQL snake_case.
- DateTime UTC/timestamptz; salary/experience Decimal, tiền kèm currency/period. JSONB cho dữ liệu mở rộng, cột lọc chính tách riêng.
- Validate quan hệ cùng owner cho mọi ID liên kết; chỉ kiểm tra userId trên bản ghi ngoài cùng là chưa đủ.
- Candidate*, Resume*, SearchProfile, JobMatch, UserJob, JobApplication và logs cá nhân theo userId. JobPosting PUBLIC_SOURCE dùng chung khi được phép; PRIVATE_IMPORT có ownerUserId và không lọt qua dedup/cache/query sang người khác.
- Review partial unique indexes, constraints score 0–100, salary range, CV mặc định và key chống trùng khi tới phase liên quan; SQL migration nếu Prisma không biểu diễn đủ.
- Mark Applied transaction + unique(userId, jobPostingId); status history chỉ ghi khi có thay đổi. Không cascade xóa application theo CV/JD; snapshots lịch sử đầy đủ.
- Runtime pooled DATABASE_URL, CLI/migrations DIRECT_URL. Không migration trong build hoặc tự db push production. Chỉ tạo migration với schema thực, có review/backup/rollback.
- Gate Neon Development: dùng kết nối read-only đọc neon.project_id/neon.branch_id/neon.endpoint_id cho pooled/direct; đối chiếu branch ID với tên development bằng API hoặc thông tin Neon Console được xác nhận. Chỉ có NODE_ENV=development hoặc SQL SELECT 1 là chưa đủ. Chưa đối chiếu được thì không migration/seed/login/register trên endpoint đó.
- Không lưu binary CV trong DB, không log secrets/raw CV/prompt; deletion/retention được chốt theo nghiệp vụ trước khi triển khai.
