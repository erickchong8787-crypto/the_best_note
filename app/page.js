'use client';
import { useEffect, useState } from 'react';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load notes.');
        }
        setNotes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load notes.');
      }
    };

    loadNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Enter both a title and note before saving.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save note.');
      }

      setNotes((currentNotes) => [data, ...currentNotes]);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) {
      return;
    }

    setError('');
    setDeletingNoteId(note.id);
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(note.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note.');
      }

      setNotes((currentNotes) => currentNotes.filter((currentNote) => currentNote.id !== note.id));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">📝 Cloud Note Pad</h1>
      
      {/* Note Inputs Block */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-xl shadow-sm bg-gray-50 flex flex-col gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <label htmlFor="note-title" className="mb-2 block text-sm font-semibold text-gray-700">
            Note title
          </label>
          <input
            id="note-title"
            type="text"
            placeholder="Enter a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <label htmlFor="note-content" className="mb-2 block text-sm font-semibold text-gray-700">
            Write your note
          </label>
          <textarea
            id="note-content"
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="5"
            className="w-full resize-y rounded-lg border border-gray-300 p-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button type="submit" disabled={isSaving} className="bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? 'Saving...' : 'Save Note'}
        </button>
        {error && <p role="alert" className="text-red-600">{error}</p>}
      </form>

      {/* List showing live notes */}
      <div className="flex flex-col gap-4">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-center">No notes found. Create your first note above!</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 border rounded-xl shadow-sm bg-white text-black">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg">{note.title}</h2>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">{note.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note)}
                  disabled={deletingNoteId === note.id}
                  className="text-red-600 hover:text-red-800 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Delete note: ${note.title}`}
                >
                  {deletingNoteId === note.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
