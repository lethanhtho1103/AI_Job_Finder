import type { Role } from '@/generated/prisma/enums';

declare module 'next-auth' {
  interface User {
    username: string;
    role: Role;
  }
  interface Session {
    user: { id: string; username: string; role: Role };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sessionId?: string;
    username?: string;
    role?: Role;
  }
}
