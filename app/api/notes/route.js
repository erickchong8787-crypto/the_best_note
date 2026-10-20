import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// This establishes a direct, blazing-fast web connection using your database URL
const sql = neon(process.env.DATABASE_URL);

// 1. GET Method: Fetches all notes directly via SQL query
export async function GET() {
  try {
    const notes = await sql`SELECT * FROM "Note" ORDER BY "createdAt" DESC`;
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Database error details:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST method: Saves a new note directly via SQL insert
export async function POST(request) {
  try {
    const { title, content } = await request.json();
    
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // We execute the SQL insert statement here
    const result = await sql`
      INSERT INTO "Note" (id, title, content, "createdAt", "updatedAt")
      VALUES (${id}, ${title}, ${content}, ${createdAt}, ${updatedAt})
      RETURNING *
    `;

    // CRITICAL FIX: The Neon driver returns an Array list (e.g., [newNote]). 
    // grab the single object sitting at index 0 to send to the UI
    const newNote = result[0]; 

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("Database error details:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
