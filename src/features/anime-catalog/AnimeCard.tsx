import { useState } from 'react';
import type { Anime } from './api';
import { getScoreTone } from './score';
import styles from './AnimeCard.module.css';

export function AnimeCard({ anime }: { anime: Anime }) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const hasCover =
    anime.coverImage !== null && failedCover !== anime.coverImage;
  return (
    <article className={styles.card} aria-label={anime.title}>
      {hasCover ? (
        <img
          className={styles.cover}
          src={anime.coverImage ?? undefined}
          alt={`Capa de ${anime.title}`}
          loading="lazy"
          width="316"
          height="270"
          onError={() => setFailedCover(anime.coverImage)}
        />
      ) : (
        <div
          className={styles.missingCover}
          role="img"
          aria-label={`Capa indisponível para ${anime.title}`}
        >
          <span>Sem imagem</span>
        </div>
      )}
      <div className={styles.content}>
        <h2 className={styles.title}>{anime.title}</h2>
        {anime.genres.length > 0 && (
          <ul className={styles.genres} aria-label="Gêneros">
            {anime.genres.map((genre) => (
              <li key={genre}>{genre}</li>
            ))}
          </ul>
        )}
        <span
          className={`${styles.score} ${styles[getScoreTone(anime.averageScore)]}`}
          aria-label={
            anime.averageScore === null
              ? 'Sem avaliação'
              : `Avaliação: ${anime.averageScore} de 100`
          }
        >
          {anime.averageScore === null
            ? 'Sem avaliação'
            : `${anime.averageScore}%`}
        </span>
      </div>
    </article>
  );
}
