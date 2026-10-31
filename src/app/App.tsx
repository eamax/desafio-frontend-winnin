import { AnimeCatalog } from '../features/anime-catalog/AnimeCatalog';
import styles from './App.module.css';
import './global.css';
export function App() {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#catalog">
        Pular para o catálogo
      </a>
      <header className={styles.header}>
        <h1>
          BUSC<span>ANIME</span>
        </h1>
      </header>
      <main id="catalog" className={styles.main}>
        <AnimeCatalog />
      </main>
      <footer className={styles.footer}>
        <p>
          BUSC<span>ANIME</span>
        </p>
        <small>TODOS OS DIREITOS RESERVADOS</small>
      </footer>
    </div>
  );
}
