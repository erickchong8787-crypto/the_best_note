import { NextResponse } from 'next/server';
import {
  removeSession,
  sessionCookieName,
  sessionCookieOptions,
} from '../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    await removeSession(cookieStore.get(sessionCookieName())?.value);
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionCookieName(), '', { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    console.error('Sign out failed:', error);
    return NextResponse.json({ error: 'Could not sign out.' }, { status: 500 });
  }
}
