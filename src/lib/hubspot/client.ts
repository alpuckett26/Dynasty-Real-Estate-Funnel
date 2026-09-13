import { Client } from '@hubspot/api-client';
import type {
  HubSpotContactProperties,
  HubSpotDealProperties,
  HubSpotTask,
  PipelineStage,
} from '@/types/crm';

let _client: Client | null = null;

function getClient(): Client {
  if (!_client) {
    if (!process.env.HUBSPOT_ACCESS_TOKEN) {
      throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is not set');
    }
    _client = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
  }
  return _client;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function findContactByEmailOrPhone(
  email?: string,
  phone?: string
): Promise<string | null> {
  const client = getClient();

  if (email) {
    try {
      const result = await client.crm.contacts.basicApi.getById(
        email,
        undefined,
        undefined,
        undefined,
        undefined,
        'email'
      );
      if (result.id) return result.id;
    } catch {
      // not found
    }
  }

  if (phone) {
    try {
      const searchResult = await client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: 'phone', operator: 'EQ' as never, value: phone },
            ],
          },
        ],
        sorts: [],
        properties: ['id'],
        limit: 1,
        after: '0',
      });
      if (searchResult.results.length > 0) {
        return searchResult.results[0].id;
      }
    } catch {
      // not found
    }
  }

  return null;
}

export async function createContact(
  properties: HubSpotContactProperties
): Promise<string> {
  const client = getClient();
  const result = await client.crm.contacts.basicApi.create({
    properties: flattenProperties(properties),
    associations: [],
  });
  return result.id;
}

export async function updateContact(
  contactId: string,
  properties: Partial<HubSpotContactProperties>
): Promise<void> {
  const client = getClient();
  await client.crm.contacts.basicApi.update(contactId, {
    properties: flattenProperties(properties),
  });
}

export async function upsertContact(
  properties: HubSpotContactProperties
): Promise<{ contactId: string; action: 'created' | 'updated' }> {
  const existing = await findContactByEmailOrPhone(
    properties.email,
    properties.phone
  );

  if (existing) {
    await updateContact(existing, properties);
    return { contactId: existing, action: 'updated' };
  }

  const contactId = await createContact(properties);
  return { contactId, action: 'created' };
}

export interface RecentContact {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  lead_route?: string;
  channel_source?: string;
  total_lead_score?: string;
  createdate?: string;
}

/** Contacts created since the given epoch ms — powers the daily lead digest. */
export async function searchContactsCreatedSince(sinceMs: number): Promise<RecentContact[]> {
  const client = getClient();
  const contacts: RecentContact[] = [];
  let after: string | undefined = '0';

  while (after !== undefined && contacts.length < 500) {
    const page = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            { propertyName: 'createdate', operator: 'GTE' as never, value: String(sinceMs) },
          ],
        },
      ],
      sorts: ['-createdate'] as never,
      properties: [
        'firstname', 'lastname', 'email', 'phone',
        'lead_route', 'channel_source', 'total_lead_score', 'createdate',
      ],
      limit: 100,
      after,
    });

    for (const r of page.results) {
      const props: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(r.properties)) {
        props[k] = v ?? undefined;
      }
      contacts.push({ id: r.id, ...(props as Omit<RecentContact, 'id'>) });
    }
    after = page.paging?.next?.after;
  }

  return contacts;
}

// ─── Deals ────────────────────────────────────────────────────────────────────

/**
 * HubSpot's `dealstage` must be the stage's internal id (e.g. "4302060251" in a
 * custom pipeline), not a readable key. Deals were sent `qualified_buyer`, which
 * HubSpot rejects, and the caller swallowed the error — so no deal was ever
 * created. Stage ids are assigned by HubSpot when the pipeline is created and
 * differ per portal, so they are resolved at runtime by matching the stage
 * label ("Qualified – Buyer") to the key ("qualified_buyer") instead of being
 * hard-coded.
 */
const stageIdCache = new Map<string, Promise<Map<string, string>>>();

const normaliseStage = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function loadStageIds(pipelineId: string): Promise<Map<string, string>> {
  let pending = stageIdCache.get(pipelineId);
  if (!pending) {
    pending = getClient()
      .crm.pipelines.pipelinesApi.getById('deals', pipelineId)
      .then((p) => new Map(p.stages.map((s) => [normaliseStage(s.label), s.id])));
    // A failed lookup must not poison the instance; let the next deal retry it.
    pending.catch(() => stageIdCache.delete(pipelineId));
    stageIdCache.set(pipelineId, pending);
  }
  return pending;
}

async function resolveDealStageId(pipelineId: string, stage: PipelineStage): Promise<string> {
  let stages: Map<string, string>;
  try {
    stages = await loadStageIds(pipelineId);
  } catch (err) {
    throw new Error(
      `Deal pipeline "${pipelineId}" could not be loaded — check HUBSPOT_PIPELINE_ID ` +
        `(run npm run setup:hubspot to print the right id): ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Keys with no matching stage (e.g. needs_lender) belong at the pipeline's start.
  const id = stages.get(normaliseStage(stage)) ?? stages.get(normaliseStage('new_lead'));
  if (!id) {
    throw new Error(
      `Deal pipeline "${pipelineId}" has no "${stage}" or "New Lead" stage — ` +
        'HUBSPOT_PIPELINE_ID likely points at a pipeline other than Dynasty Sales Pipeline'
    );
  }
  return id;
}

export async function createDeal(
  contactId: string,
  properties: HubSpotDealProperties
): Promise<string> {
  const client = getClient();
  const dealstage = await resolveDealStageId(properties.pipeline, properties.dealstage);
  const result = await client.crm.deals.basicApi.create({
    properties: flattenProperties({ ...properties, dealstage }),
    associations: [
      {
        to: { id: contactId },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED' as never,
            associationTypeId: 3, // contact-to-deal
          },
        ],
      },
    ],
  });
  return result.id;
}

export async function updateDealStage(
  dealId: string,
  stage: PipelineStage,
  pipelineId = process.env.HUBSPOT_PIPELINE_ID ?? 'default'
): Promise<void> {
  const client = getClient();
  const dealstage = await resolveDealStageId(pipelineId, stage);
  await client.crm.deals.basicApi.update(dealId, {
    properties: { dealstage },
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(
  contactId: string,
  task: HubSpotTask
): Promise<string> {
  const client = getClient();

  // HubSpot only notifies the *assigned* user. No call site passes an ownerId,
  // so every task since April was created unassigned and silently notified
  // nobody — including hot-lead call-now tasks. DEFAULT_TASK_OWNER_ID makes the
  // assignee configurable without a deploy.
  const ownerId = task.ownerId ?? process.env.HUBSPOT_DEFAULT_OWNER_ID ?? '';
  if (!ownerId) {
    console.warn(
      `[HubSpot] Task "${task.subject}" created UNASSIGNED — nobody will be notified. ` +
        'Set HUBSPOT_DEFAULT_OWNER_ID to the agent who should receive lead tasks.'
    );
  }

  const result = await client.crm.objects.tasks.basicApi.create({
    properties: {
      hs_task_subject: task.subject,
      hs_task_body: task.body,
      hs_task_status: task.status,
      hs_task_type: task.taskType,
      hs_timestamp: String(task.dueDate),
      hubspot_owner_id: ownerId,
    },
    associations: [
      {
        to: { id: contactId },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED' as never,
            associationTypeId: 204, // task-to-contact
          },
        ],
      },
    ],
  });
  return result.id;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function createNote(
  contactId: string,
  body: string
): Promise<string> {
  const client = getClient();
  const result = await client.crm.objects.notes.basicApi.create({
    properties: {
      hs_note_body: body,
      hs_timestamp: String(Date.now()),
    },
    associations: [
      {
        to: { id: contactId },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED' as never,
            associationTypeId: 202, // note-to-contact
          },
        ],
      },
    ],
  });
  return result.id;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenProperties(obj: object): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) {
      flat[k] = String(v);
    }
  }
  return flat;
}
