'use client';

import { Button } from 'antd';
import { FeedbackPanel } from '@/components/ui/feedback-panel';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <FeedbackPanel
      label="Không thể tải nội dung"
      title="Trang tạm thời bị gián đoạn"
      action={
        <Button type="primary" onClick={reset}>
          Thử lại
        </Button>
      }
    >
      Hãy thử tải lại nội dung. Nếu lỗi tiếp tục, bạn có thể quay lại sau.
    </FeedbackPanel>
  );
}
