import { Link } from 'react-router-dom';

import { supportEmail } from '../lib/site-contact';
import styles from './LegalPage.module.css';

export function AccountDeletion() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>Delete your account</h1>
      <p className={styles.lede}>
        GetGrounded mobile app · package <strong>app.getgrounded.dev</strong>
      </p>

      <section className={styles.section}>
        <h2>How to request deletion</h2>
        <p>
          Email{' '}
          <a href={`mailto:${supportEmail}?subject=Delete%20my%20GetGrounded%20account`}>
            {supportEmail}
          </a>{' '}
          from the same address you use to sign in. Use subject line:{' '}
          <strong>Delete my GetGrounded account</strong>. We may reply once to confirm before erasing
          data.
        </p>
        <p>
          In-app deletion is coming; until then, email is the official path. See also our{' '}
          <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>What we delete</h2>
        <ul>
          <li>Your book: days, plans, tasks, wins, and related metadata in GetGrounded</li>
          <li>Voice session records and storage keys tied to your account</li>
          <li>Your Firebase authentication record for this app</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>What we do not delete with your account</h2>
        <ul>
          <li>
            Waitlist email on this marketing site — unsubscribe from list emails separately if you only
            joined early access here
          </li>
          <li>
            Aggregated or de-identified analytics that cannot reasonably identify you
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>What we may keep briefly</h2>
        <p>
          Encrypted database backups may retain deleted data for up to 30 days, then roll off. We do not
          use deleted journal content for marketing or model training.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Timeline</h2>
        <p>We process deletion requests within 30 days, usually within a few business days.</p>
      </section>

      <Link to="/" className={styles.back}>
        ← Back to GetGrounded
      </Link>
    </article>
  );
}
