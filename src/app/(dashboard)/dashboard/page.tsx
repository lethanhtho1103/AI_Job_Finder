import type { Metadata } from 'next';
import { Tag } from 'antd';
import { requireUser } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  // Kiểm tra tại page, không chỉ dựa vào layout để bảo vệ dữ liệu.
  const user = await requireUser();
  return (
    <section className="dashboard-welcome">
      <p className="eyebrow">Không gian tìm việc cá nhân</p>
      <h1>Xin chào, {user.username}.</h1>
      <Tag>
        {user.role === 'Administrator' ? 'Quản trị viên' : 'Người dùng'}
      </Tag>
      <p>
        Bạn đã đăng nhập thành công. Các tính năng hồ sơ và tìm việc sẽ được
        phát triển trong những giai đoạn tiếp theo.
      </p>
    </section>
  );
}
