---
version: alpha
name: AI Job Finder
description: Không gian tìm việc cá nhân, sáng và rõ ràng, với màu teal và hành trình CV đến công việc.
colors:
  primary: '#0f766e'
  primary-hover: '#115e59'
  ink: '#17343b'
  muted: '#52676d'
  background: '#f3f6f5'
  surface: '#ffffff'
  border: '#ccd8d5'
  accent: '#e0eeea'
  scrollbar: '#78958e'
  scrollbar-hover: '#526f68'
typography:
  sans:
    fontFamily: "'Segoe UI', Arial, sans-serif"
  mono:
    fontFamily: "Consolas, 'Courier New', monospace"
rounded:
  DEFAULT: '12px'
  control: '8px'
spacing:
  page-max: '1240px'
  section-gap: '64px'
components:
  button:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
  button-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.surface}'
  journey-note:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
  journey-path:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.ink}'
  divider:
    backgroundColor: '{colors.border}'
  feedback-panel:
    backgroundColor: '{colors.background}'
    textColor: '{colors.muted}'
  scrollbar:
    backgroundColor: '{colors.scrollbar}'
  scrollbar-hover:
    backgroundColor: '{colors.scrollbar-hover}'
---

# AI Job Finder Design System

## Overview

### Creative North Star

Một cuốn sổ hành trình nghề nghiệp: thông tin được xếp theo từng bước, khoảng trắng đủ đọc, một đường nối từ CV đến công việc thay cho dashboard số liệu khi chưa có dữ liệu.

### Product context and register

- Đối tượng: người dùng cá nhân tìm việc; căn cứ PRD chương 1–4. Giai đoạn 0 giải thích sản phẩm đang phát triển, chưa thực hiện tìm kiếm.
- Ngôn ngữ: tiếng Việt theo lựa chọn người dùng. Chưa có cam kết thị trường theo quốc gia, chưa có locale switcher. Code dùng tiếng Anh.
- Usage: desktop để đọc JD/hồ sơ, mobile để xem nhanh. Register sản phẩm tiện ích, không landing quảng cáo phô trương.
- Signature: đường nối CV → Tiêu chí → Công việc ở khối ghi chú. Các số 01–04 thể hiện thứ tự nghiệp vụ thật, không phải thống kê giả.
- Restraint: surfaces phẳng, không gradient/ảnh/animation trang trí hoặc dashboard mẫu. Không làm nút cho tính năng chưa tồn tại.
- Anti-references: trang hứa tự động có việc, dashboard fake statistics, neon/dark marketing; không phù hợp nhu cầu kiểm soát hành trình cá nhân.
- Nguồn token runtime duy nhất: `src/lib/theme.ts`. DESIGN.md mirrors các giá trị đã chốt, không generate CSS. Thay token phải cập nhật cả tài liệu và source.

## Colors

Primary teal cho hành động/link/focus; ink cho tiêu đề/body; muted cho nội dung thứ cấp; background/surface tạo tầng; border chia vùng; accent chỉ dùng nhãn hành trình. Không dùng màu đơn độc để truyền đạt trạng thái. Không gán primary như trạng thái dịch vụ đã kết nối. Chỉ có light theme ở phase 0; forced-colors dùng màu hệ thống.

## Typography

Segoe UI/Arial hỗ trợ tiếng Việt, không tải font mạng. Body 16px/1.65; mô tả hero 18px/1.75. H1 clamp 44–72px, weight 650, line-height 1.12; h2 25–28px, weight 600. Mono chỉ cho số bước và nhãn hành trình. Chữ in hoa chỉ eyebrow ngắn, không toàn đoạn. Không italic cho nội dung chính.

## Layout

Page max 1240px, padding 24–64px theo viewport. Header 104px desktop, 84px mobile. Hero 2 cột từ lg/1024px, dưới đó xếp dọc; workflow 1/2/4 cột theo 640/1024px. Không khung chiều cao cố định cho nội dung, document sở hữu scroll. Text dài được wrap. Footer tự xuống dòng, không che focus. Page dùng font hệ thống và CSS SSR để hạn chế layout shift.

## Elevation & Depth

Nền xám xanh nhạt và bề mặt trắng, border mảnh; không dùng card shadow. Ghi chú hành trình có viền trên primary 4px làm điểm nhấn duy nhất. Overlay chưa có workflow sử dụng.

## Shapes

Container radius 12px, controls 8px. Badge hành trình radius 4px, không áp pill cho mọi thành phần. Border 1px trừ điểm nhấn ghi chú.

## Components

### Foundational visual states

Ant Design sở hữu trạng thái controls. Native link có hover/active/focus-visible; focus outline 3px primary, offset 5px. Disabled/busy dựa trên semantics Antd khi feature thực sự cần. Không tạo spinner cho trang tĩnh; loading/empty/search/form states được thiết kế khi có workflow tương ứng. Motion tối thiểu; reduced-motion bỏ smooth scroll và rút ngắn transitions.

### Buttons and actions

Primary CTA là Antd Button link tới phần cách hoạt động đang có thật. Error reset là button, 404 return là link. Controls height 44px. Không wrap library Button để tạo abstraction khi chưa có nhu cầu dùng lại thực tế; không browser alert/confirm/prompt.

### Navigation and data display

SiteShell sở hữu brand/home link, skip link, main landmark và footer. FeedbackPanel dùng chung hierarchy cho 404/error. Chưa có data table hoặc authentication navigation. Không báo điểm, số công việc hoặc tích hợp giả.

### Forms and overlays

Chưa áp dụng ở phase 0. Khi bổ sung dùng Ant Design controls, validation tiếng Việt và Zod, lựa chọn overlay theo workflow. Không tạo contract/form primitives rỗng trước.

### Iconography

Phase 0 chỉ có dấu mũi tên văn bản và brand chữ `j.` bằng HTML; decorative glyph có aria-hidden. Tên hành động luôn bằng chữ, không icon-only action.

### Motion

Không animation khởi động. Anchor scroll smooth khi người dùng không yêu cầu reduced motion. Không hiệu ứng chuyển động liên tục hoặc phụ thuộc animation để hiểu nội dung.

### Content and data visualization

Tiếng Việt trực tiếp, không hứa kết quả tuyển dụng. Tách rõ cách hoạt động dự kiến với tính năng hiện có. Lỗi nói điều có thể làm tiếp, không lộ stack/credentials. Chưa có charts hoặc dữ liệu cần format thời gian/tiền ở phase 0.

### Token mapping và canonical owners

| Owner                             | Adapter                         | Consumer                                                                       |
| --------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `tokens` trong `src/lib/theme.ts` | `themeVariables` trên html root | Global CSS; Tailwind `@theme inline` aliases primary/muted/font-sans           |
| Cùng `tokens`                     | `antdTheme` qua ConfigProvider  | Ant Design components, controls và locale vi_VN                                |
| `src/styles/globals.css`          | Global baseline                 | Scrollbars, focus, reduced motion, forced colors; không opt-in scrollbar class |
| SiteShell/FeedbackPanel           | React components                | Home, 404, error boundary                                                      |

Kiểm tra drift bằng cách đối chiếu token frontmatter với `tokens`, CSS không hardcode lại palette; production E2E kiểm tra computed scrollbar, SSR/hydration và axe. UI hiện có một trang giới thiệu nên chưa cần UX-CONTRACT.md đa màn hình. Thêm contract khi có workflow thực sự.

## Do's and Don'ts

- **Do:** Dùng thông tin thực, nhãn đang phát triển và thứ tự hành trình đúng nghiệp vụ.
- **Do:** Giữ theme token chung, tiếng Việt, focus/scrollbar dùng được trên cả desktop/mobile.
- **Don't:** Thêm job cards hoặc thống kê mẫu vào production.
- **Don't:** Tạo nút Login/Search giả hoặc đưa chi tiết hạ tầng vào luồng sản phẩm.
