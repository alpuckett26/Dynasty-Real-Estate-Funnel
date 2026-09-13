import { describe, it, expect, vi, beforeEach } from 'vitest';

const getById = vi.fn();
const dealCreate = vi.fn();
vi.mock('@hubspot/api-client', () => ({
  Client: class {
    crm = {
      pipelines: { pipelinesApi: { getById } },
      deals: { basicApi: { create: dealCreate } },
    };
  },
}));

import { createDeal } from '@/lib/hubspot/client';

/**
 * HubSpot only accepts a stage's internal id as `dealstage`. Deals used to be
 * sent readable keys like "qualified_buyer", HubSpot rejected every one, and
 * the caller swallowed it — no deal was ever created.
 */
const STAGES = [
  { id: '4302060249', label: 'New Lead' },
  { id: '4302060251', label: 'Qualified – Buyer' },
  { id: '4302060260', label: 'Nurture – Long Term' },
];

let pipelineSeq = 0;
const freshPipeline = () => `pipe-${++pipelineSeq}`; // the stage map is cached per pipeline id

beforeEach(() => {
  process.env.HUBSPOT_ACCESS_TOKEN = 'pat-test';
  getById.mockReset();
  dealCreate.mockReset();
  dealCreate.mockResolvedValue({ id: 'deal-1' });
});

const sentStage = () => dealCreate.mock.calls[0][0].properties.dealstage;

describe('createDeal stage resolution', () => {
  it('sends the stage id, matched to the key by label', async () => {
    getById.mockResolvedValue({ stages: STAGES });
    await createDeal('c1', { dealname: 'x', dealstage: 'qualified_buyer', pipeline: freshPipeline() });
    expect(sentStage()).toBe('4302060251');
  });

  it('matches labels with dashes and spaces', async () => {
    getById.mockResolvedValue({ stages: STAGES });
    await createDeal('c1', { dealname: 'x', dealstage: 'nurture_long_term', pipeline: freshPipeline() });
    expect(sentStage()).toBe('4302060260');
  });

  it('puts keys with no matching stage at New Lead', async () => {
    getById.mockResolvedValue({ stages: STAGES });
    await createDeal('c1', { dealname: 'x', dealstage: 'needs_lender', pipeline: freshPipeline() });
    expect(sentStage()).toBe('4302060249');
  });

  it('names HUBSPOT_PIPELINE_ID when the pipeline cannot be loaded', async () => {
    getById.mockRejectedValue(new Error('404 Not Found'));
    await expect(
      createDeal('c1', { dealname: 'x', dealstage: 'new_lead', pipeline: freshPipeline() })
    ).rejects.toThrow(/HUBSPOT_PIPELINE_ID/);
    expect(dealCreate).not.toHaveBeenCalled();
  });

  it('retries the lookup after a failure instead of caching it', async () => {
    const pipeline = freshPipeline();
    getById.mockRejectedValueOnce(new Error('503')).mockResolvedValue({ stages: STAGES });
    await expect(createDeal('c1', { dealname: 'x', dealstage: 'new_lead', pipeline })).rejects.toThrow();
    await createDeal('c1', { dealname: 'x', dealstage: 'new_lead', pipeline });
    expect(sentStage()).toBe('4302060249');
  });
});
