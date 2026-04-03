import { describe, it, expect } from 'vitest';
import { scoreLead, getTaskDueDateMs } from '@/lib/scoring/lead-scorer';

describe('scoreLead', () => {
  it('returns partner route immediately with zero score', () => {
    const result = scoreLead({ isPartner: true });
    expect(result.route).toBe('partner');
    expect(result.totalScore).toBe(0);
  });

  it('scores a warm lead — ready now, pre-approved, area + budget, both contacts', () => {
    const result = scoreLead({
      timeline: '0-3m',
      financingStatus: 'pre-approved',
      hasArea: true,
      hasBudget: true,
      hasEmail: true,
      hasPhone: true,
    });
    // 30 (timeline) + 20 (financing) + 15 (area+budget) = 65 → warm
    expect(result.totalScore).toBe(65);
    expect(result.route).toBe('warm');
  });

  it('scores hot when showing is requested and contact info provided', () => {
    const result = scoreLead({
      timeline: '0-3m',
      financingStatus: 'pre-approved',
      hasArea: true,
      hasBudget: true,
      requestedShowing: true,
      hasEmail: true,
      hasPhone: true,
    });
    // 30 + 20 + 15 + 20 = 85
    expect(result.totalScore).toBe(85);
    expect(result.route).toBe('hot');
  });

  it('route is cold for researching, no financing, no area/budget', () => {
    const result = scoreLead({
      timeline: '12m+',
      financingStatus: 'unknown',
    });
    expect(result.route).toBe('cold');
  });

  it('penalises missing contact info', () => {
    const withBoth = scoreLead({ timeline: '0-3m', hasEmail: true, hasPhone: true });
    const missingBoth = scoreLead({ timeline: '0-3m', hasEmail: false, hasPhone: false });
    const missingOne = scoreLead({ timeline: '0-3m', hasEmail: true, hasPhone: false });

    expect(withBoth.totalScore).toBeGreaterThan(missingOne.totalScore);
    expect(missingOne.totalScore).toBeGreaterThan(missingBoth.totalScore);
  });

  it('gives areaOrBudget (7) when only one is provided', () => {
    const result = scoreLead({ hasArea: true, hasBudget: false });
    expect(result.breakdown.areaOrBudget).toBe(7);
    expect(result.breakdown.areaAndBudget).toBeUndefined();
  });

  it('gives areaAndBudget (15) when both are provided', () => {
    const result = scoreLead({ hasArea: true, hasBudget: true });
    expect(result.breakdown.areaAndBudget).toBe(15);
    expect(result.breakdown.areaOrBudget).toBeUndefined();
  });

  it('route thresholds: hot >= 70, warm 40-69, cold < 40', () => {
    // hot: 30+20+15+20 = 85 (with contacts, no penalty)
    expect(scoreLead({ timeline: '0-3m', financingStatus: 'pre-approved', hasArea: true, hasBudget: true, requestedShowing: true, hasEmail: true, hasPhone: true }).route).toBe('hot');
    // warm: 30+20+15 = 65 (with contacts, no penalty)
    expect(scoreLead({ timeline: '0-3m', financingStatus: 'pre-approved', hasArea: true, hasBudget: true, hasEmail: true, hasPhone: true }).route).toBe('warm');
    // cold: 0+0 = 0 - 20 (no contact) = -20
    expect(scoreLead({ timeline: '12m+', financingStatus: 'unknown' }).route).toBe('cold');
  });
});

describe('getTaskDueDateMs', () => {
  it('hot lead due in 30 minutes', () => {
    const before = Date.now();
    const due = getTaskDueDateMs('hot');
    expect(due - before).toBeGreaterThanOrEqual(29 * 60 * 1000);
    expect(due - before).toBeLessThanOrEqual(31 * 60 * 1000);
  });

  it('warm lead due in 24 hours', () => {
    const before = Date.now();
    const due = getTaskDueDateMs('warm');
    expect(due - before).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000);
    expect(due - before).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  });

  it('cold lead due in 72 hours', () => {
    const before = Date.now();
    const due = getTaskDueDateMs('cold');
    expect(due - before).toBeGreaterThanOrEqual(71 * 60 * 60 * 1000);
  });
});
