import { NextRequest } from 'next/server';
import { gateway } from '@/lib/api/gateway';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
  return gateway(request, params.path.join('/'));
}
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
