import { NextResponse } from 'next/server';
import {
  createSession,
  ensureAuthSchema,
  getSql,
  sessionCookieName,
  sessionCookieOptions,
  verifyPassword,
} from '../../../lib/auth';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || email.length > 254 || !password || password.length > 128) {
    return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  }

  try {
    await ensureAuthSchema();
    const sql = getSql();
    const users = await sql`
      SELECT id, email, "passwordHash"
      FROM "User"
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    if (users.length === 0 || !(await verifyPassword(password, users[0].passwordHash))) {
      return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    }

    const token = await createSession(users[0].id);
    const response = NextResponse.json({ user: { id: users[0].id, email: users[0].email } });
    response.cookies.set(sessionCookieName(), token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Sign in failed:', error);
    return NextResponse.json({ error: 'We could not sign you in. Please try again.' }, { status: 500 });
  }
}
