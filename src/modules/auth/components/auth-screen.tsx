export function AuthScreen({
  registration,
  children,
}: {
  registration: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="auth-screen grid gap-10 lg:grid-cols-2 lg:gap-20">
      <div className="auth-intro">
        <p className="eyebrow">Không gian của riêng bạn</p>
        <h1>
          {registration
            ? 'Bắt đầu hành trình\ncủa bạn.'
            : 'Trở lại hành trình\ncủa bạn.'}
        </h1>
        <p>Một tài khoản để giữ mọi bước tìm việc ở cùng một nơi.</p>
        <div className="auth-principle">
          <span aria-hidden="true">↗</span>
          <p>
            Bạn chủ động chọn công việc và ứng tuyển. AI sẽ hỗ trợ đối chiếu
            thông tin trong những phiên bản tiếp theo.
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
