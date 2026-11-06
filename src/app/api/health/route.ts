export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { status: 'ok', service: 'ai-job-finder' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
