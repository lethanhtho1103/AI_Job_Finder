import 'server-only';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDatabase } from '@/server/db/client';
import { loginSchema, normalizeUsername } from '@/modules/auth/validation';
import { authenticateUser } from './service';
import { allowsDevelopmentAccounts, getAuthSecret } from './environment';
import {
  consumeRateLimit,
  getClientAddress,
  RateLimitError,
} from './rate-limit';

export const sessionMaxAge = 8 * 60 * 60;

export function getAuthOptions(): NextAuthOptions {
  return {
    secret: getAuthSecret(),
    session: { strategy: 'jwt', maxAge: sessionMaxAge },
    jwt: { maxAge: sessionMaxAge },
    useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
    pages: { signIn: '/login', error: '/login' },
    providers: [
      CredentialsProvider({
        credentials: {
          username: { type: 'text' },
          password: { type: 'password' },
        },
        async authorize(credentials, request) {
          try {
            await consumeRateLimit(
              'login-address',
              getClientAddress(request.headers ?? {}),
              30,
              15 * 60,
            );
            const result = loginSchema.safeParse(credentials);
            if (!result.success) return null;
            await consumeRateLimit(
              'login-username',
              normalizeUsername(result.data.username),
              10,
              15 * 60,
            );
            return await authenticateUser(
              result.data.username,
              result.data.password,
            );
          } catch (error) {
            // NextAuth đưa error.message vào response URL; chỉ ném mã an toàn.
            throw new Error(
              error instanceof RateLimitError
                ? 'RATE_LIMITED'
                : 'AUTH_UNAVAILABLE',
            );
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        const database = getDatabase();
        if (user) {
          const session = await database.authSession.create({
            data: {
              userId: user.id,
              expiresAt: new Date(Date.now() + sessionMaxAge * 1000),
            },
          });
          token.sessionId = session.id;
        }
        if (typeof token.sessionId !== 'string')
          throw new Error('SESSION_INVALID');
        const session = await database.authSession.findUnique({
          where: { id: token.sessionId },
          include: { user: true },
        });
        if (
          !session ||
          session.expiresAt <= new Date() ||
          (session.user.developmentOnly && !allowsDevelopmentAccounts())
        )
          throw new Error('SESSION_INVALID');
        token.sub = session.user.id;
        token.username = session.user.username;
        token.role = session.user.role;
        return token;
      },
      async session({ session, token }) {
        session.user = {
          id: token.sub!,
          username: token.username!,
          role: token.role!,
        };
        return session;
      },
      async redirect({ url, baseUrl }) {
        return url === '/login' || url === `${baseUrl}/login`
          ? `${baseUrl}/login`
          : `${baseUrl}/dashboard`;
      },
    },
    events: {
      async signOut(message) {
        if (
          'token' in message &&
          typeof message.token?.sessionId === 'string'
        ) {
          await getDatabase().authSession.deleteMany({
            where: { id: message.token.sessionId },
          });
        }
      },
    },
    // Không truyền metadata lỗi của thư viện vào log (có thể chứa request/token).
    logger: {
      error() {
        console.error('AUTH_REQUEST_FAILED');
      },
      warn() {},
      debug() {},
    },
  };
}
