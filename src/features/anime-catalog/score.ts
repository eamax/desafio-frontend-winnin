export type ScoreTone = 'red' | 'yellow' | 'green' | 'neutral';

export function getScoreTone(score: number | null): ScoreTone {
  if (score === null) return 'neutral';
  if (score < 50) return 'red';
  if (score <= 80) return 'yellow';
  return 'green';
}
