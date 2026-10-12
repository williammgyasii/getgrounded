import { Link, Outlet } from 'react-router-dom';
import styles from './SiteLayout.module.css';

const copyrightYear = new Date().getFullYear();

export function SiteLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.wordmark}>
          GetGrounded
        </Link>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <nav className={styles.footerNav} aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/account-deletion">Delete account</Link>
        </nav>
        <p className={styles.footerCopy}>© {copyrightYear} GetGrounded</p>
      </footer>
    </div>
  );
}
