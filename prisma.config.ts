import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Không dùng env() để việc validate schema không cần credentials.
  // Các lệnh truy cập DB vẫn yêu cầu DIRECT_URL thật; không có URL dự phòng.
  datasource: { url: process.env.DIRECT_URL },
});
