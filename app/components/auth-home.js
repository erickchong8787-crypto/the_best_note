'use client';

import { useState } from 'react';

export default function AuthHome() {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'We could not complete your request.');
      }

      window.location.reload();
    } catch (requestError) {
      setError(requestError.message || 'We could not complete your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="welcome-panel" aria-label="About Stillnote">
          <a className="brand" href="/" aria-label="Stillnote home">
            <span className="brand-mark" aria-hidden="true">s</span>
            <span>stillnote</span>
          </a>

          <div className="welcome-copy">
            <span className="eyebrow">A little space for your mind</span>
            <h1>Make room for what matters.</h1>
            <p>
              A calm place to collect your thoughts, keep your ideas close, and
              come back to them whenever you need.
            </p>
          </div>

          <div className="note-preview" aria-hidden="true">
            <span className="preview-label"><span /> YOUR SPACE, YOUR PACE</span>
            <p>“The quieter you become, the more you can hear.”</p>
            <span className="preview-date">A thought worth keeping · Just now</span>
          </div>

          <span className="welcome-footer">A softer way to stay organized.</span>
        </section>

        <section className="form-panel" aria-labelledby="form-title">
          <div className="form-panel-inner">
            <div className="mobile-brand brand" aria-hidden="true">
              <span className="brand-mark">s</span>
              <span>stillnote</span>
            </div>

            <div className="form-heading">
              <span className="form-kicker">{isSignup ? 'START YOUR SPACE' : 'WELCOME BACK'}</span>
              <h2 id="form-title">{isSignup ? 'Create your account' : 'Sign in to your space'}</h2>
              <p>
                {isSignup
                  ? 'A few details and your notes are ready when you are.'
                  : 'Your thoughts are right where you left them.'}
              </p>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button
                type="button"
                role="tab"
                aria-selected={isSignup}
                className={isSignup ? 'auth-tab active' : 'auth-tab'}
                onClick={() => changeMode('signup')}
              >
                Create account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isSignup}
                className={!isSignup ? 'auth-tab active' : 'auth-tab'}
                onClick={() => changeMode('login')}
              >
                Sign in
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <div className="password-label">
                <label htmlFor="password">Password</label>
                {isSignup && <span>At least 8 characters</span>}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="Enter your password"
                minLength={isSignup ? 8 : undefined}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create your account'
                    : 'Sign in'}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="terms-copy">
              {isSignup ? (
                <>Already have an account? <button type="button" onClick={() => changeMode('login')}>Sign in</button></>
              ) : (
                <>New to stillnote? <button type="button" onClick={() => changeMode('signup')}>Create an account</button></>
              )}
            </p>
          </div>

          <span className="form-footer">Your notes are private to your account.</span>
        </section>
      </div>
    </main>
  );
}
