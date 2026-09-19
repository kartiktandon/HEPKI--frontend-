import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  return NextResponse.json({ user: !!request.cookies.get('hb_user_access')?.value, provider: !!request.cookies.get('hb_provider_access')?.value }, { headers: { 'Cache-Control': 'no-store' } });
}
