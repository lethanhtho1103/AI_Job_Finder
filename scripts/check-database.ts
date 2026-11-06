import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from '../src/server/db/config';

async function main() {
  let databaseUrl: string;
  try {
    databaseUrl = getDatabaseUrl({ DATABASE_URL: process.env.DATABASE_URL });
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }

  try {
    const sql = neon(databaseUrl, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });
    const rows = await sql`SELECT 1 AS ok`;
    if (rows[0]?.ok !== 1) throw new Error('Unexpected response');
    console.log('Kết nối Neon thành công (SELECT 1). Không thay đổi dữ liệu.');
  } catch {
    console.error(
      'Không thể xác minh kết nối Neon trong 10 giây. Kiểm tra mạng, quyền truy cập và credentials.',
    );
    process.exitCode = 1;
  }
}

await main();
