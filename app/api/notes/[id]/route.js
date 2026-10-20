import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const deletedNotes = await sql`
      DELETE FROM "Note"
      WHERE id = ${id}
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
