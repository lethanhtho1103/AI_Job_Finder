import { Button as AntButton, Tag } from 'antd';

const steps = [
  {
    title: 'Bắt đầu từ bạn',
    text: 'Hồ sơ, kinh nghiệm và CV làm cơ sở để tìm công việc phù hợp.',
  },
  {
    title: 'Nói điều bạn tìm',
    text: 'Mô tả công việc mong muốn, rồi kiểm tra và điều chỉnh tiêu chí.',
  },
  {
    title: 'Hiểu mức phù hợp',
    text: 'Đối chiếu CV với yêu cầu tuyển dụng, xem điểm mạnh và kỹ năng còn thiếu.',
  },
  {
    title: 'Chủ động ứng tuyển',
    text: 'Tự nộp hồ sơ trên trang tuyển dụng và ghi lại tiến trình của mình.',
  },
];

export default function HomePage() {
  return (
    <>
      <section
        className="hero grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16"
        aria-labelledby="home-title"
      >
        <div>
          <Tag color="default" className="development-tag">
            Sản phẩm đang phát triển
          </Tag>
          <h1 id="home-title">
            Tìm việc có
            <br />
            <span className="text-primary">định hướng.</span>
          </h1>
          <p className="hero-description">
            Một nơi để hiểu công việc nào hợp với bạn, chủ động ứng tuyển và
            theo dõi từng bước tiếp theo.
          </p>
          <AntButton type="primary" size="large" href="#cach-hoat-dong">
            Khám phá cách hoạt động <span aria-hidden="true">↗</span>
          </AntButton>
          <p className="availability-note">
            Các tính năng tìm việc sẽ được mở trong những phiên bản tiếp theo.
          </p>
        </div>
        <aside className="journey-note" aria-labelledby="journey-title">
          <p className="eyebrow">Hành trình của bạn</p>
          <div className="journey-path" aria-hidden="true">
            <span>CV</span>
            <span>Tiêu chí</span>
            <span>Công việc</span>
          </div>
          <h2 id="journey-title">
            Công cụ hỗ trợ.
            <br />
            Quyết định thuộc về bạn.
          </h2>
          <p>
            AI giúp đọc và đối chiếu thông tin. Bạn chọn công việc, tự gửi hồ sơ
            và xác nhận khi đã ứng tuyển.
          </p>
          <div className="note-caption">
            <span aria-hidden="true">↗</span> Mỗi bước đều nằm trong tầm kiểm
            soát của bạn.
          </div>
        </aside>
      </section>
      <section
        id="cach-hoat-dong"
        className="workflow"
        aria-labelledby="workflow-title"
      >
        <div className="section-heading">
          <p className="eyebrow">Cách hoạt động dự kiến</p>
          <h2 id="workflow-title">Từ CV đến bước tiếp theo</h2>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="workflow-step">
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
