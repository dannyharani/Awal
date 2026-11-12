import { describe, it, expect } from 'vitest';
import { scheduleSrsReview, isCardDue, formatIntervalLabel } from './srs';

describe('Spaced Repetition Scheduler (SRS)', () => {
  it('treats unseen cards as due and advances intervals on Good/Easy grades', () => {
    const now = 1_700_000_000_000;
    expect(isCardDue(undefined, now)).toBe(true);

    const first = scheduleSrsReview(undefined, 'aman', 'good', now);
    expect(first.intervalDays).toBe(1);
    expect(first.reps).toBe(1);
    expect(isCardDue(first, now + 1000)).toBe(false);
    expect(isCardDue(first, now + 86_400_000)).toBe(true);

    const second = scheduleSrsReview(first, 'aman', 'good', now + 86_400_000);
    expect(second.intervalDays).toBe(4);
    expect(second.reps).toBe(2);

    const easyJump = scheduleSrsReview(second, 'aman', 'easy', now + 5 * 86_400_000);
    expect(easyJump.intervalDays).toBeGreaterThanOrEqual(10);
  });

  it('resets repetitions on Again grade without letting ease drop below 1.3', () => {
    const now = 1_700_000_000_000;
    const prev = scheduleSrsReview(undefined, 'adrar', 'good', now);
    const reset = scheduleSrsReview(prev, 'adrar', 'again', now + 86_400_000);
    expect(reset.intervalDays).toBe(0);
    expect(reset.reps).toBe(0);
    expect(reset.ease).toBeGreaterThanOrEqual(1.3);
    expect(formatIntervalLabel(0)).toBe('10m');
    expect(formatIntervalLabel(4)).toBe('4d');
  });
});
