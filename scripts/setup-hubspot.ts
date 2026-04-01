#!/usr/bin/env npx ts-node
/**
 * Dynasty Real Estate — HubSpot Setup Script
 *
 * Creates all custom contact properties, property groups, and the deal pipeline.
 * Run once after connecting your HubSpot account.
 *
 * Usage:
 *   HUBSPOT_ACCESS_TOKEN=pat-na1-xxx npx ts-node scripts/setup-hubspot.ts
 *
 * The script is idempotent — safe to run multiple times.
 */

import { Client } from '@hubspot/api-client';
import config from '../config/hubspot-properties.json';

const client = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN! });

type PropertyType = 'string' | 'number' | 'bool' | 'datetime' | 'enumeration';
type FieldType = 'text' | 'textarea' | 'number' | 'booleancheckbox' | 'select' | 'date' | 'checkbox';

interface PropertyOption {
  label: string;
  value: string;
  displayOrder: number;
  hidden?: boolean;
}

interface PropertyDef {
  name: string;
  label: string;
  groupName: string;
  type: PropertyType;
  fieldType: FieldType;
  description?: string;
  options?: PropertyOption[];
  formField?: boolean;
  displayOrder?: number;
}

async function createPropertyGroups() {
  console.log('\n📂 Creating property groups...');
  for (const group of config.propertyGroups) {
    try {
      await client.crm.properties.groupsApi.create('contacts', {
        name: group.name,
        displayOrder: group.displayOrder,
        label: group.label,
      });
      console.log(`  ✅ Created group: ${group.label}`);
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e.code === 409 || (e.message && e.message.includes('already exists'))) {
        console.log(`  ⏭️  Group exists: ${group.label}`);
      } else {
        console.error(`  ❌ Failed: ${group.label}`, e.message);
      }
    }
  }
}

async function createContactProperties() {
  console.log('\n🏷️  Creating contact properties...');
  for (const prop of config.contactProperties as PropertyDef[]) {
    try {
      await client.crm.properties.coreApi.create('contacts', {
        name: prop.name,
        label: prop.label,
        groupName: prop.groupName,
        type: prop.type,
        fieldType: prop.fieldType,
        description: prop.description ?? '',
        options: (prop.options ?? []).map((o) => ({
          label: o.label,
          value: o.value,
          displayOrder: o.displayOrder,
          hidden: o.hidden ?? false,
        })),
        formField: prop.formField ?? false,
        displayOrder: prop.displayOrder ?? 99,
      });
      console.log(`  ✅ Created: ${prop.label} (${prop.name})`);
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e.code === 409 || (e.message && e.message.includes('already exists'))) {
        // Update instead
        try {
          await client.crm.properties.coreApi.update('contacts', prop.name, {
            label: prop.label,
            description: prop.description ?? '',
            options: (prop.options ?? []).map((o) => ({
              label: o.label,
              value: o.value,
              displayOrder: o.displayOrder,
              hidden: o.hidden ?? false,
            })),
          });
          console.log(`  🔄 Updated: ${prop.label}`);
        } catch (updateErr) {
          console.error(`  ❌ Update failed: ${prop.name}`, updateErr);
        }
      } else {
        console.error(`  ❌ Failed: ${prop.label}`, e.message);
      }
    }
  }
}

async function createPipeline() {
  console.log('\n🚦 Creating deal pipeline...');
  const pipeline = config.pipeline;
  try {
    const existing = await client.crm.pipelines.pipelinesApi.getAll('deals');
    const match = existing.results.find((p) => p.label === pipeline.label);

    if (match) {
      console.log(`  ⏭️  Pipeline exists: ${pipeline.label} (id: ${match.id})`);
      console.log(`  💡 Set HUBSPOT_PIPELINE_ID=${match.id} in your env file.`);
      return;
    }

    const result = await client.crm.pipelines.pipelinesApi.create('deals', {
      label: pipeline.label,
      displayOrder: 0,
      stages: pipeline.stages.map((s) => ({
        label: s.label,
        displayOrder: s.displayOrder,
        metadata: {
          probability: String(s.metadata.probability),
          isClosed: String((s.metadata as Record<string, unknown>).isClosed ?? 'false'),
        },
      })),
    });

    console.log(`  ✅ Created pipeline: ${pipeline.label} (id: ${result.id})`);
    console.log(`  💡 Set HUBSPOT_PIPELINE_ID=${result.id} in your env file.`);
    result.stages?.forEach((stage) => {
      console.log(`     Stage: "${stage.label}" → id: ${stage.id}`);
    });
  } catch (err) {
    console.error('  ❌ Pipeline creation failed:', err);
  }
}

async function createContactListsForRoutes() {
  console.log('\n📋 Tip: Create these Active Lists in HubSpot for automation enrollment:');
  const lists = [
    { name: 'Dynasty – Hot Leads', filter: 'lead_route = Hot' },
    { name: 'Dynasty – Warm Leads', filter: 'lead_route = Warm' },
    { name: 'Dynasty – Cold Leads', filter: 'lead_route = Cold' },
    { name: 'Dynasty – Partner Leads', filter: 'lead_route = Partner' },
    { name: 'Dynasty – Dormant 30', filter: 'reactivation_segment = dormant_30' },
    { name: 'Dynasty – Dormant 60', filter: 'reactivation_segment = dormant_60' },
    { name: 'Dynasty – Dormant 90+', filter: 'reactivation_segment = dormant_90' },
    { name: 'Dynasty – SMS Consented', filter: 'consent_sms = true' },
    { name: 'Dynasty – Email Consented', filter: 'consent_email = true' },
  ];
  lists.forEach((l) => console.log(`  • ${l.name}  (filter: ${l.filter})`));
}

async function main() {
  console.log('🏰 Dynasty Real Estate — HubSpot Setup');
  console.log('='.repeat(50));

  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.error('\n❌ HUBSPOT_ACCESS_TOKEN is required.\n');
    process.exit(1);
  }

  await createPropertyGroups();
  await createContactProperties();
  await createPipeline();
  await createContactListsForRoutes();

  console.log('\n✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Copy HUBSPOT_PIPELINE_ID from above into your .env file');
  console.log('  2. Create the Active Lists listed above');
  console.log('  3. Build your workflow automations in HubSpot using those lists');
  console.log('  4. Run: npm run dev');
}

main().catch((err) => {
  console.error('\n💥 Setup failed:', err);
  process.exit(1);
});
