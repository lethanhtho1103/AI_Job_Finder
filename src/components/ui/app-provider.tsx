'use client';

import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { antdTheme } from '@/lib/theme';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <StyleProvider layer>
      <ConfigProvider locale={viVN} theme={antdTheme}>
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
