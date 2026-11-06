import { requireUser } from '@/server/auth/session';
import { LogoutButton } from '@/modules/auth/components/logout-button';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <>
      <div className="account-bar">
        <span>
          Đang đăng nhập: <strong>{user.username}</strong>
        </span>
        <LogoutButton />
      </div>
      {children}
    </>
  );
}
