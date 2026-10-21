'use client';

import { useEffect, useState } from 'react';

export default function NotesPage({ user }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load notes.');
        }
        setNotes(Array.isArray(data) ? data : []);
      } catch (requestError) {
        console.error(requestError);
        setError(requestError.message || 'Failed to load notes.');
      }
    };

    loadNotes();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to save note.');
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
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to delete note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const startEditing = (note) => {
    setEditingNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditedTitle('');
    setEditedContent('');
    setEditError('');
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingNote || !editedTitle.trim() || !editedContent.trim()) {
      setEditError('Enter both a title and note before saving.');
      return;
    }

    setEditError('');
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(editingNote.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle, content: editedContent }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update note.');
      }

      setNotes((currentNotes) => currentNotes.map((note) => note.id === data.id ? data : note));
      cancelEditing();
    } catch (requestError) {
      console.error(requestError);
      setEditError(requestError.message || 'Failed to update note.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Could not log out. Please try again.');
      }
      window.location.assign('/');
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Could not log out. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <main className="notes-page">
      <header className="notes-header">
        <a className="brand notes-brand" href="/" aria-label="Stillnote home">
          <span className="brand-mark" aria-hidden="true">s</span>
          <span>stillnote</span>
        </a>
        <div className="account-menu">
          <span className="account-email">{user.email}</span>
          <button
            type="button"
            className="signout-button"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </header>

      <section className="notes-content">
        <div className="notes-intro">
          <span className="form-kicker">YOUR PRIVATE SPACE</span>
          <h1>Good to have you back.</h1>
          <p>Keep a thought, make a plan, or simply start wherever you are.</p>
        </div>

        <form onSubmit={handleSubmit} className="note-editor">
          <label htmlFor="note-title">Give this note a title</label>
          <input
            id="note-title"
            type="text"
            placeholder="A thought to remember..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
          />
          <label htmlFor="note-content">Write it down</label>
          <textarea
            id="note-content"
            placeholder="Let your thoughts find a place to land."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={5}
            required
          />
          <div className="editor-footer">
            <span>Your notes are saved to your account.</span>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save note'} {!isSaving && <span aria-hidden="true">→</span>}
            </button>
          </div>
          {editError && <p className="auth-error" role="alert">{editError}</p>}
        </form>

        <div className="notes-list-heading">
          <h2>Your notes</h2>
          <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
        </div>

        {notes.length === 0 ? (
          <div className="empty-notes">
            <span className="empty-icon" aria-hidden="true">✳</span>
            <h3>A fresh page</h3>
            <p>Your first note is just above. Add anything you want to remember.</p>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map((note) => {
              const isEditing = editingNote?.id === note.id;

              return (
                <article key={note.id} className="note-card">
                  {isEditing ? (
                    <form className="inline-note-editor" onSubmit={handleUpdate}>
                      <label htmlFor={`edit-title-${note.id}`}>Title</label>
                      <input
                        id={`edit-title-${note.id}`}
                        type="text"
                        value={editedTitle}
                        onChange={(event) => setEditedTitle(event.target.value)}
                        maxLength={200}
                        required
                      />
                      <label htmlFor={`edit-content-${note.id}`}>Note</label>
                      <textarea
                        id={`edit-content-${note.id}`}
                        value={editedContent}
                        onChange={(event) => setEditedContent(event.target.value)}
                        rows={5}
                        required
                      />
                      {error && <p className="auth-error" role="alert">{error}</p>}
                      <div className="note-actions">
                        <button
                          type="button"
                          className="cancel-edit-button"
                          onClick={cancelEditing}
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="save-edit-button" disabled={isUpdating}>
                          {isUpdating ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="note-card-content">
                        <h3>{note.title}</h3>
                        <p>{note.content}</p>
                        <time dateTime={note.createdAt}>
                          {new Date(note.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                      <div className="note-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(note)}
                          disabled={isUpdating || deletingNoteId === note.id}
                          aria-label={`Edit note: ${note.title}`}
                          className="edit-note-button"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note)}
                          disabled={deletingNoteId === note.id || isUpdating}
                          aria-label={`Delete note: ${note.title}`}
                          className="delete-note-button"
                        >
                          {deletingNoteId === note.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
