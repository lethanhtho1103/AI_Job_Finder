import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppProvider } from '@/components/ui/app-provider';
import { SiteShell } from '@/components/layout/site-shell';
import { themeVariables } from '@/lib/theme';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI Job Finder — Tìm việc có định hướng',
    template: '%s | AI Job Finder',
  },
  description:
    'Không gian tìm việc cá nhân: đối chiếu CV với công việc, tự ứng tuyển và theo dõi hành trình của bạn. Sản phẩm đang được phát triển.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" style={themeVariables}>
      <body>
        <AntdRegistry>
          <AppProvider>
            <SiteShell>{children}</SiteShell>
          </AppProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
