import { Link } from 'react-router-dom';

import { privacyEmail, supportEmail } from '../lib/site-contact';
import styles from './LegalPage.module.css';

const lastUpdated = 'October 12, 2026';

export function Privacy() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>Privacy policy</h1>
      <p className={styles.lede}>Last updated: {lastUpdated}</p>

      <section className={styles.section}>
        <h2>Who we are</h2>
        <p>
          GetGrounded (“we,” “us”) provides a voice-first app to plan your day and reflect honestly.
          This policy covers <strong>get-grounded.app</strong> (this site) and the GetGrounded mobile app
          (package <strong>app.getgrounded.dev</strong>).
        </p>
      </section>

      <section className={styles.section}>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account:</strong> Email and authentication identifiers when you sign in (Firebase
            Auth). We do not use your email as the primary key in our database.
          </li>
          <li>
            <strong>Your book:</strong> Plans, tasks, wins, day summaries, and related metadata you
            create in the app — stored in our database (PostgreSQL).
          </li>
          <li>
            <strong>Voice:</strong> When you use voice features, audio may be processed for
            transcription and plan extraction. Transcripts are used to update your book; we do not sell
            them.
          </li>
          <li>
            <strong>Waitlist:</strong> Email address if you join early access on this website (via our
            email provider).
          </li>
          <li>
            <strong>Device / usage:</strong> Standard app diagnostics (e.g. crash reports) when enabled,
            to keep the service reliable.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>How we use information</h2>
        <ul>
          <li>Run the product: sign-in, save your days, show your desk and history.</li>
          <li>Process voice into structured plans you can review before saving.</li>
          <li>Send waitlist and product emails you signed up for.</li>
          <li>Protect the service: abuse prevention, debugging, and legal compliance.</li>
        </ul>
        <p>
          We do <strong>not</strong> use your spoken journal or transcripts for advertising. We do{' '}
          <strong>not</strong> sell personal information.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Service providers</h2>
        <p>We use trusted processors to operate the app, for example:</p>
        <ul>
          <li>Firebase (Google) — authentication and app platform services</li>
          <li>Cloud hosting and storage — API, database, and optional voice file storage</li>
          <li>Speech and language AI — transcription and extraction (server-side only; keys are not on your phone)</li>
          <li>Cloudflare — this website and related infrastructure</li>
          <li>Email / waitlist tools — early-access list for this site</li>
        </ul>
        <p>Providers process data only to deliver the service on our instructions.</p>
      </section>

      <section className={styles.section}>
        <h2>Retention</h2>
        <p>
          We keep your book while your account is active. If you delete your account, we erase your
          book and login as described on our{' '}
          <Link to="/account-deletion">account deletion</Link> page. Backups may retain encrypted copies
          for a limited period (up to about 30 days) before they roll off.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>Access / correction:</strong> Use the app to review and edit your plans, or email us.
          </li>
          <li>
            <strong>Deletion:</strong> Request account and data deletion — see{' '}
            <Link to="/account-deletion">Delete account</Link>.
          </li>
          <li>
            <strong>Waitlist:</strong> Unsubscribe from marketing emails using the link in those messages.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Children</h2>
        <p>
          GetGrounded is not directed at children under 13 (or the minimum age in your region). We do
          not knowingly collect their data.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Changes</h2>
        <p>
          We may update this policy. We will post the new date at the top of this page. Continued use
          after changes means you accept the updated policy.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Contact</h2>
        <p>
          Privacy:{' '}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
          <br />
          Account deletion:{' '}
          <a href={`mailto:${supportEmail}?subject=Delete%20my%20GetGrounded%20account`}>
            {supportEmail}
          </a>
        </p>
      </section>

      <Link to="/" className={styles.back}>
        ← Back to GetGrounded
      </Link>
    </article>
  );
}
