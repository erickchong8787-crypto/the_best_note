import { NextResponse } from 'next/server';
import { getCurrentUser, getSql } from '../../../lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to edit notes.' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Enter a valid title and note.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Enter a valid title and note.' }, { status: 400 });
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!title || !content || title.length > 200) {
      return NextResponse.json({ error: 'Enter a title (up to 200 characters) and note.' }, { status: 400 });
    }

    const { id } = await params;
    const sql = getSql();
    const updatedNotes = await sql`
      UPDATE "Note"
      SET title = ${title}, content = ${content}, "updatedAt" = NOW()
      WHERE id = ${id} AND "userId" = ${user.id}
      RETURNING id, title, content, "createdAt", "updatedAt"
    `;

    if (updatedNotes.length === 0) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedNotes[0]);
  } catch (error) {
    console.error('Database error details:', error);
    return NextResponse.json({ error: 'Failed to update note.' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to delete notes.' }, { status: 401 });
    }

    const sql = getSql();
    const { id } = await params;
    const deletedNotes = await sql`
      DELETE FROM "Note"
      WHERE id = ${id} AND "userId" = ${user.id}
      RETURNING id
    `;

    if (deletedNotes.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ id: deletedNotes[0].id });
  } catch (error) {
    console.error('Database error details:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
