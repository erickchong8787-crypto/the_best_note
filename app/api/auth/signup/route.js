import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  createSession,
  ensureAuthSchema,
  getSql,
  hashPassword,
  sessionCookieName,
  sessionCookieOptions,
} from '../../../lib/auth';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Password must be between 8 and 128 characters.' }, { status: 400 });
  }

  try {
    await ensureAuthSchema();
    const sql = getSql();
    const users = await sql`
      INSERT INTO "User" (id, email, "passwordHash")
      VALUES (${randomUUID()}, ${email}, ${await hashPassword(password)})
      ON CONFLICT DO NOTHING
      RETURNING id, email
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'An account with that email already exists. Sign in instead.' }, { status: 409 });
    }

    const token = await createSession(users[0].id);
    const response = NextResponse.json({ user: users[0] }, { status: 201 });
    response.cookies.set(sessionCookieName(), token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Account creation failed:', error);
    return NextResponse.json({ error: 'We could not create your account. Please try again.' }, { status: 500 });
  }
}
