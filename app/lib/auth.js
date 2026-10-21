import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'stillnote_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
let sqlClient;
let schemaSetup;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured to use account and note storage.');
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }

  return sqlClient;
}

export async function ensureAuthSchema() {
  if (!schemaSetup) {
    schemaSetup = setupAuthSchema();
  }

  try {
    await schemaSetup;
  } catch (error) {
    schemaSetup = undefined;
    throw error;
  }
}

async function setupAuthSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "UserSession" (
      id TEXT PRIMARY KEY,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "UserSession_userId_idx"
    ON "UserSession" ("userId")
  `;
  await sql`
    ALTER TABLE "Note"
    ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS "Note_userId_createdAt_idx"
    ON "Note" ("userId", "createdAt" DESC)
  `;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) {
    return false;
  }

  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return timingSafeEqual(actual, expected);
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const sql = getSql();

  await sql`
    INSERT INTO "UserSession" (id, "tokenHash", "userId", "expiresAt")
    VALUES (${randomUUID()}, ${hashSessionToken(token)}, ${userId}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  await ensureAuthSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT "User".id, "User".email
    FROM "UserSession"
    JOIN "User" ON "User".id = "UserSession"."userId"
    WHERE "UserSession"."tokenHash" = ${hashSessionToken(token)}
      AND "UserSession"."expiresAt" > NOW()
    LIMIT 1
  `;

  return rows[0] || null;
}

export async function removeSession(token) {
  if (!token) {
    return;
  }

  await ensureAuthSchema();
  const sql = getSql();
  await sql`
    DELETE FROM "UserSession"
    WHERE "tokenHash" = ${hashSessionToken(token)}
  `;
}
