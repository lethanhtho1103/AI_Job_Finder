import type { Metadata } from 'next';
import { Button } from 'antd';
import { FeedbackPanel } from '@/components/ui/feedback-panel';

export const metadata: Metadata = { title: 'Không tìm thấy trang' };

export default function NotFound() {
  return (
    <FeedbackPanel
      label="Lỗi 404"
      title="Không tìm thấy trang"
      action={
        <Button type="primary" href="/">
          Về trang chủ
        </Button>
      }
    >
      Đường dẫn này không tồn tại. Bạn có thể quay lại trang chủ để tiếp tục.
    </FeedbackPanel>
  );
}
