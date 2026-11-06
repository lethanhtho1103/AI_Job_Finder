# Business rules

Nguồn: PRD tại root, chương 2–4, 7, 9 và 13.

- MVP: tìm theo nút bấm, AI hỗ trợ, người dùng tự Apply và xác nhận; không scheduler/billing/Auto Apply.
- Mở URL chỉ ghi hành vi xem/mở, không tạo JobApplication. Applied cần xác nhận, `applicationMethod=MANUAL`, `confirmationSource=USER_REPORTED`.
- UserJob là trạng thái cá nhân NEW/VIEWED/SAVED/SKIPPED/HIDDEN; JobApplication là APPLIED/INTERVIEWING/REJECTED/OFFERED/WITHDRAWN. Không dùng trạng thái toàn cục JobPosting cho một người dùng.
- Unique(userId, jobPostingId) và transaction/upsert chống double-submit; không mất application khi tìm lại hoặc xóa CV/JD. Giữ snapshots.
- Trong nguồn ưu tiên externalJobId, fallback URL chuẩn hóa/sourceScopedKey. Không tự gộp khác nguồn chỉ bởi title/company.
- Nguồn UNKNOWN không được quét; chỉ API/feed/nguồn đã được phép. Manual URL/JD là phương án dự phòng, import riêng phải có owner.
- Hard filters trước AI; unknown salary không bằng 0; chỉ so lương cùng currency/period hoặc theo quy tắc chuyển đổi đã xác định.
- CV parse và criteria AI cần người dùng duyệt; missing information hiển thị chưa rõ. Điểm 0–100 không phải xác suất nhận việc.
- AI lỗi vẫn dùng hard filters; lỗi một nguồn không bỏ kết quả nguồn khác. Không hứa miễn phí vĩnh viễn.
