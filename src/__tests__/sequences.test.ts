import { describe, it, expect } from 'vitest';
import { selectSequence, BUYER_HOT, BUYER_CREDIT, BUYER_WARM, SELLER, BUYER_SELLER } from '@/lib/sequences/index';

describe('selectSequence', () => {
  it('returns BUYER_CREDIT for credit repair tags', () => {
    expect(selectSequence(['Needs: Credit Repair'])).toBe(BUYER_CREDIT);
  });

  it('returns BUYER_SELLER for Both intent', () => {
    expect(selectSequence(['Intent: Both'])).toBe(BUYER_SELLER);
  });

  it('returns SELLER for seller intent', () => {
    expect(selectSequence(['Intent: Seller'])).toBe(SELLER);
  });

  it('returns BUYER_HOT for Timeline: Now', () => {
    expect(selectSequence(['Intent: Buyer', 'Timeline: Now'])).toBe(BUYER_HOT);
  });

  it('returns BUYER_HOT for Timeline: 30-60 Days', () => {
    expect(selectSequence(['Intent: Buyer', 'Timeline: 30-60 Days'])).toBe(BUYER_HOT);
  });

  it('returns BUYER_WARM for buyer with longer timeline', () => {
    expect(selectSequence(['Intent: Buyer', 'Timeline: 3-6 Months'])).toBe(BUYER_WARM);
  });

  it('prioritises credit repair over seller intent', () => {
    expect(selectSequence(['Intent: Seller', 'Needs: Credit Repair'])).toBe(BUYER_CREDIT);
  });

  it('returns null for unrecognised tags', () => {
    expect(selectSequence(['Lead Source: ads'])).toBeNull();
  });

  it('returns null for empty tags array', () => {
    expect(selectSequence([])).toBeNull();
  });
});

describe('sequence structure', () => {
  const sequences = [BUYER_HOT, BUYER_CREDIT, BUYER_WARM, SELLER, BUYER_SELLER];

  it('every sequence has at least 2 steps', () => {
    for (const seq of sequences) {
      expect(seq.steps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('step 0 always has delayHours = 0', () => {
    for (const seq of sequences) {
      expect(seq.steps[0].delayHours).toBe(0);
    }
  });

  it('every step has a non-empty body', () => {
    for (const seq of sequences) {
      for (const step of seq.steps) {
        expect(step.body.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('email steps have a subject', () => {
    for (const seq of sequences) {
      for (const step of seq.steps) {
        if (step.channel === 'email') {
          expect(step.subject).toBeTruthy();
        }
      }
    }
  });
});
