import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.hero}>
      <div className={styles.content}>
        <h1>Welcome to MediFind</h1>

        <p>
          Find medicines available at nearby pharmacies and place an order in
          just a few clicks.
        </p>

        <Link href="/search" className={styles.searchButton}>
          Find Medicine
        </Link>
      </div>
    </main>
  );
}