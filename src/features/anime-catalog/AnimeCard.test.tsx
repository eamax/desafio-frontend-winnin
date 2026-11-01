import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimeCard } from './AnimeCard';
import type { Anime } from './api';

const anime: Anime = {
  id: 1,
  title: 'Cowboy Bebop',
  coverImage: 'https://example.com/cover.jpg',
  genres: ['Action', 'Sci-Fi'],
  averageScore: 80,
};

describe('AnimeCard', () => {
  it('preserves explicit title newlines without injecting breaks into other records', () => {
    const title = 'Zom 100: Zombie ni Naru Made\nni Shitai 100 no Koto';
    const { rerender } = render(<AnimeCard anime={{ ...anime, title }} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(title);
    rerender(
      <AnimeCard anime={{ ...anime, title: 'An unmodified live title' }} />,
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'An unmodified live title',
    );
  });

  it('renders the title, genres, cover and accessible numeric score', () => {
    render(<AnimeCard anime={anime} />);
    expect(
      screen.getByRole('heading', { name: 'Cowboy Bebop', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Gêneros' })).toHaveTextContent(
      'Action',
    );
    expect(
      screen.getByRole('img', { name: 'Capa de Cowboy Bebop' }),
    ).toHaveAttribute('src', anime.coverImage);
    expect(screen.getByLabelText('Avaliação: 80 de 100')).toHaveTextContent(
      '80%',
    );
  });

  it('shows an unavailable score without replacing it with zero', () => {
    render(<AnimeCard anime={{ ...anime, averageScore: null }} />);
    expect(screen.getByLabelText('Sem avaliação')).toHaveTextContent(
      'Sem avaliação',
    );
    expect(
      screen.queryByLabelText('Avaliação: 0 de 100'),
    ).not.toBeInTheDocument();
  });

  it('provides an accessible missing cover state', () => {
    render(<AnimeCard anime={{ ...anime, coverImage: null, genres: [] }} />);
    expect(
      screen.getByRole('img', { name: 'Capa indisponível para Cowboy Bebop' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('replaces a failed image and recovers when the cover URL changes', () => {
    const { rerender } = render(<AnimeCard anime={anime} />);
    fireEvent.error(screen.getByRole('img', { name: 'Capa de Cowboy Bebop' }));
    expect(
      screen.getByRole('img', { name: 'Capa indisponível para Cowboy Bebop' }),
    ).toBeInTheDocument();
    rerender(
      <AnimeCard
        anime={{ ...anime, coverImage: 'https://example.com/replacement.jpg' }}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Capa de Cowboy Bebop' }),
    ).toHaveAttribute('src', 'https://example.com/replacement.jpg');
  });
});
