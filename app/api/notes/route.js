import { NextResponse } from 'next/server';
import { getCurrentUser, getSql } from '../../lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to view your notes.' }, { status: 401 });
    }

    const sql = getSql();
    const notes = await sql`
      SELECT id, title, content, "createdAt", "updatedAt"
      FROM "Note"
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Database error details:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to save notes.' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Enter a valid title and note.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Enter a valid title and note.' }, { status: 400 });
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!title || !content) {
      return NextResponse.json({ error: 'A title and note are required.' }, { status: 400 });
    }

    const sql = getSql();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const result = await sql`
      INSERT INTO "Note" (id, title, content, "createdAt", "updatedAt", "userId")
      VALUES (${id}, ${title}, ${content}, ${createdAt}, ${updatedAt}, ${user.id})
      RETURNING id, title, content, "createdAt", "updatedAt"
    `;

    const newNote = result[0];
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Database error details:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
