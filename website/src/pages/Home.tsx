import { WaitlistForm } from '../components/WaitlistForm';
import styles from './Home.module.css';

export function Home() {
  const heroVideo = import.meta.env.VITE_HERO_VIDEO_URL;

  return (
    <article className={styles.page}>
      <h1 className={styles.hero}>You don&apos;t tap a list. You say the day.</h1>
      <p className={styles.proof}>Speak the morning. Live the day. Tell the truth at night.</p>
      <WaitlistForm />
      <p className={styles.quiet}>You&apos;re on the list. We open the beta in waves.</p>
      {heroVideo ? (
        <div className={styles.film}>
          <video src={heroVideo} controls muted playsInline className={styles.filmVideo} />
        </div>
      ) : (
        <div className={styles.film} aria-hidden>
          <p className={styles.filmPlaceholder}>Hero film — set VITE_HERO_VIDEO_URL when ready.</p>
        </div>
      )}
    </article>
  );
}
