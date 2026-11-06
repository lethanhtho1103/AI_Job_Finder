import type { NextRequest } from 'next/server';
import { registerUser } from '@/server/auth/service';
import { isAuthConfigured } from '@/server/auth/environment';
import {
  consumeRateLimit,
  getClientAddress,
  RateLimitError,
} from '@/server/auth/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const error = (code: string, message: string, status: number) =>
    Response.json(
      { error: { code, message } },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  if (!isAuthConfigured())
    return error('AUTH_UNAVAILABLE', 'Đăng ký tạm thời chưa sẵn sàng.', 503);
  if (
    request.headers.get('origin') !== new URL(process.env.NEXTAUTH_URL!).origin
  )
    return error('INVALID_ORIGIN', 'Yêu cầu không hợp lệ.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return error('INVALID_INPUT', 'Dữ liệu không hợp lệ.', 400);
  try {
    await consumeRateLimit(
      'register-address',
      getClientAddress(Object.fromEntries(request.headers)),
      5,
      60 * 60,
    );
    // Giới hạn cả body chunked, không tin Content-Length do client gửi.
    const reader = request.body?.getReader();
    if (!reader) return error('INVALID_INPUT', 'Dữ liệu không hợp lệ.', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return error('INVALID_INPUT', 'Dữ liệu vượt giới hạn.', 413);
      }
      chunks.push(value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return error('INVALID_INPUT', 'Dữ liệu không hợp lệ.', 400);
    }
    const result = await registerUser(input);
    if (!result.ok) {
      if (result.code === 'USERNAME_TAKEN')
        return error(result.code, 'Tên đăng nhập đã được sử dụng.', 409);
      return Response.json(
        {
          error: {
            code: result.code,
            message: 'Vui lòng kiểm tra lại thông tin.',
            fields: result.fields,
          },
        },
        { status: 400 },
      );
    }
    return Response.json(
      { ok: true },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (failure) {
    if (failure instanceof RateLimitError)
      return error(
        'RATE_LIMITED',
        'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',
        429,
      );
    return error(
      'AUTH_UNAVAILABLE',
      'Đăng ký tạm thời chưa sẵn sàng. Vui lòng thử lại sau.',
      503,
    );
  }
}
