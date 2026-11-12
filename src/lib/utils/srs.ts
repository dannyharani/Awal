export interface SrsCardProgress {
  slug: string;
  intervalDays: number;
  ease: number;
  reps: number;
  dueAt: number;
  lastReviewedAt: number;
}

export type SrsGrade = 'again' | 'hard' | 'good' | 'easy';

export const STARTER_DECK_WORDS = [
  { slug: 'azul', latin: 'Azul', tifinagh: 'ⴰⵣⵓⵍ' },
  { slug: 'tanemmirt', latin: 'Tanemmirt', tifinagh: 'ⵜⴰⵏⵎⵎⵉⵔⵜ' },
  { slug: 'aman', latin: 'Aman', tifinagh: 'ⴰⵎⴰⵏ' },
  { slug: 'adrar', latin: 'Adrar', tifinagh: 'ⴰⴷⵔⴰⵔ' },
  { slug: 'tafukt', latin: 'Tafukt', tifinagh: 'ⵜⴰⴼⵓⴽⵜ' },
  { slug: 'axxam', latin: 'Axxam', tifinagh: 'ⴰⵅⵅⴰⵎ' },
  { slug: 'awal', latin: 'Awal', tifinagh: 'ⴰⵡⴰⵍ' },
  { slug: 'tamaziɣt', latin: 'Tamaziɣt', tifinagh: 'ⵜⴰⵎⴰⵣⵉⵖⵜ' }
] as const;

const DAY_MS = 86_400_000;

/**
 * Computes the next SM-2-inspired spaced repetition schedule for a review rating.
 */
export function scheduleSrsReview(
  prev: SrsCardProgress | undefined,
  slug: string,
  grade: SrsGrade,
  now = Date.now()
): SrsCardProgress {
  const ease = prev?.ease ?? 2.5;
  const reps = prev?.reps ?? 0;
  const intervalDays = prev?.intervalDays ?? 0;

  if (grade === 'again') {
    return {
      slug,
      intervalDays: 0,
      ease: Math.max(1.3, Number((ease - 0.2).toFixed(2))),
      reps: 0,
      dueAt: now + 10 * 60 * 1000,
      lastReviewedAt: now
    };
  }

  let nextInterval: number;
  let nextEase = ease;

  if (grade === 'hard') {
    nextInterval = reps === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
    nextEase = Math.max(1.3, Number((ease - 0.15).toFixed(2)));
  } else if (grade === 'good') {
    if (reps === 0) nextInterval = 1;
    else if (reps === 1) nextInterval = 4;
    else nextInterval = Math.max(4, Math.round(intervalDays * ease));
  } else {
    // easy
    if (reps === 0) nextInterval = 4;
    else if (reps === 1) nextInterval = 7;
    else nextInterval = Math.max(7, Math.round(intervalDays * ease * 1.3));
    nextEase = Math.min(3.0, Number((ease + 0.1).toFixed(2)));
  }

  return {
    slug,
    intervalDays: nextInterval,
    ease: nextEase,
    reps: reps + 1,
    dueAt: now + nextInterval * DAY_MS,
    lastReviewedAt: now
  };
}

export function isCardDue(progress: SrsCardProgress | undefined, now = Date.now()): boolean {
  if (!progress) return true;
  return progress.dueAt <= now;
}

export function formatIntervalLabel(days: number): string {
  if (days <= 0) return '10m';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}
