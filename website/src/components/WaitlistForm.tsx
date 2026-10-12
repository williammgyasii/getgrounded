import { useState, type FormEvent } from 'react';
import styles from './WaitlistForm.module.css';

type State = 'idle' | 'submitting' | 'done' | 'error';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  const formId = import.meta.env.VITE_LOOPS_FORM_ID;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email.');
      return;
    }

    if (!formId) {
      setState('done');
      return;
    }

    setState('submitting');
    try {
      const response = await fetch(
        `https://app.loops.so/api/newsletter-form/${formId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, userGroup: 'waitlist' }),
        },
      );

      if (!response.ok) {
        throw new Error('submit failed');
      }

      setState('done');
    } catch {
      setState('error');
      setError('Could not add you right now. Try again in a moment.');
    }
  }

  if (state === 'done') {
    return (
      <p className={styles.done} role="status">
        You&apos;re in line.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)} noValidate>
      <label className={styles.label} htmlFor="email">
        Email
      </label>
      <div className={styles.row}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === 'submitting'}
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Sending…' : 'Get early access'}
        </button>
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {!formId ? (
        <p className={styles.hint}>
          List wiring pending — set <code>VITE_LOOPS_FORM_ID</code> for production.
        </p>
      ) : null}
    </form>
  );
}
