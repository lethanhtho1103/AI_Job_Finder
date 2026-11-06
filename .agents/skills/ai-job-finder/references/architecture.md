# Architecture

Nguồn: PRD chương 5, 10 và `docs/implementation-plan.md` tại root.

- Một Next.js app module-first, TypeScript strict. UI, backend cùng deployment Vercel; Neon/storage/AI bên ngoài.
- `src/app`: pages/layout/HTTP/server-action entrypoint mỏng. Không inline query phức tạp hoặc AI prompt.
- `src/modules/<feature>`: schema, DTO, components, use-case/service của feature; không nhét logic tính năng khác.
- `src/server/{db,auth,ai,storage,integrations}`: hạ tầng phía server, không import vào client. `src/lib`: tiện ích thuần/theme.
- Chỉ tạo module/folder khi có code dùng thật. Không repository pattern/generic base class mặc định.
- Ant Design sở hữu controls/state; Tailwind sở hữu layout. Theme chung `src/lib/theme.ts`, ánh xạ CSS qua root layout; đọc DESIGN.md trước sửa UI.
- Giai đoạn 0 chưa có Prisma Client hoặc model. Auth adapter/schema ở Giai đoạn 1. AI/storage/source adapter ở giai đoạn có consumer thực, không scaffold SDK vô dụng.
- Vercel Functions không chạy Ollama/PostgreSQL dài hạn. Giới hạn nguồn/JD/timeout; worker/queue chỉ cân nhắc khi có nhu cầu giai đoạn sau.
