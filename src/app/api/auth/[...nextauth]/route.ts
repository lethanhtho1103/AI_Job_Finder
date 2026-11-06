import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { getAuthOptions } from '@/server/auth/options';
import { isAuthConfigured } from '@/server/auth/environment';

export const runtime = 'nodejs';

async function handler(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!isAuthConfigured())
    return Response.json(
      {
        error: {
          code: 'AUTH_UNAVAILABLE',
          message: 'Đăng nhập tạm thời chưa sẵn sàng.',
        },
      },
      { status: 503 },
    );
  return NextAuth(getAuthOptions())(request, context);
}

export { handler as GET, handler as POST };
