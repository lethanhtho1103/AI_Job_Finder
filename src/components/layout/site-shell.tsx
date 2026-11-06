import Link from 'next/link';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#noi-dung">
        Bỏ qua đến nội dung
      </a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="AI Job Finder — Trang chủ">
          <span className="brand-mark" aria-hidden="true">
            j<span>.</span>
          </span>
          <span>AI Job Finder</span>
        </Link>
        <span className="header-note">Không gian tìm việc cá nhân</span>
      </header>
      <main id="noi-dung" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <span>AI gợi ý. Bạn quyết định.</span>
        <span>Đang phát triển · Phiên bản nền tảng</span>
      </footer>
    </div>
  );
}
