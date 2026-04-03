#!/usr/bin/env node
/**
 * Dynasty Real Estate — HubSpot Setup (plain ESM, no TypeScript)
 * Run: node scripts/setup-hubspot.mjs
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
try {
  const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
} catch {}

const token = process.env.HUBSPOT_ACCESS_TOKEN;
if (!token) {
  console.error('\n❌ HUBSPOT_ACCESS_TOKEN is not set in .env.local\n');
  process.exit(1);
}

const config = JSON.parse(readFileSync(join(__dirname, '../config/hubspot-properties.json'), 'utf8'));

const BASE = 'https://api.hubapi.com';
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function hs(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function createPropertyGroups() {
  console.log('\n📂 Creating property groups...');
  for (const group of config.propertyGroups) {
    const r = await hs('POST', '/crm/v3/properties/contacts/groups', {
      name: group.name,
      displayOrder: group.displayOrder,
      label: group.label,
    });
    if (r.ok) console.log(`  ✅ Created: ${group.label}`);
    else if (r.status === 409) console.log(`  ⏭️  Exists: ${group.label}`);
    else console.error(`  ❌ Failed: ${group.label}`, r.data?.message ?? r.data);
  }
}

async function createContactProperties() {
  console.log('\n🏷️  Creating contact properties...');
  for (const prop of config.contactProperties) {
    const body = {
      name: prop.name,
      label: prop.label,
      groupName: prop.groupName,
      type: prop.type,
      fieldType: prop.fieldType,
      description: prop.description ?? '',
      options: (prop.options ?? []).map((o, i) => ({
        label: o.label,
        value: o.value,
        displayOrder: o.displayOrder ?? i,
        hidden: o.hidden ?? false,
      })),
      formField: prop.formField ?? false,
      displayOrder: prop.displayOrder ?? 99,
    };

    const r = await hs('POST', '/crm/v3/properties/contacts', body);
    if (r.ok) {
      console.log(`  ✅ Created: ${prop.label} (${prop.name})`);
    } else if (r.status === 409) {
      // Already exists — update it
      const u = await hs('PATCH', `/crm/v3/properties/contacts/${prop.name}`, {
        label: prop.label,
        description: prop.description ?? '',
        options: body.options,
      });
      console.log(u.ok ? `  🔄 Updated: ${prop.label}` : `  ⚠️  Update skipped: ${prop.label}`);
    } else {
      console.error(`  ❌ Failed: ${prop.label}`, r.data?.message ?? r.status);
    }
  }
}

async function createPipeline() {
  console.log('\n🚦 Creating deal pipeline...');
  const pipeline = config.pipeline;

  const existing = await hs('GET', '/crm/v3/pipelines/deals');
  const match = existing.data?.results?.find(p => p.label === pipeline.label);
  if (match) {
    console.log(`  ⏭️  Pipeline exists: ${pipeline.label} (id: ${match.id})`);
    console.log(`\n  💡 Add to .env.local:  HUBSPOT_PIPELINE_ID=${match.id}`);
    return;
  }

  const r = await hs('POST', '/crm/v3/pipelines/deals', {
    label: pipeline.label,
    displayOrder: 0,
    stages: pipeline.stages.map(s => ({
      label: s.label,
      displayOrder: s.displayOrder,
      metadata: { probability: String(s.metadata.probability) },
    })),
  });

  if (r.ok) {
    console.log(`  ✅ Created pipeline: ${pipeline.label} (id: ${r.data.id})`);
    console.log(`\n  💡 Add to .env.local:  HUBSPOT_PIPELINE_ID=${r.data.id}`);
    r.data.stages?.forEach(s => console.log(`     Stage: "${s.label}" → ${s.id}`));
  } else {
    console.error('  ❌ Pipeline failed:', r.data?.message ?? r.data);
  }
}

async function main() {
  console.log('🏰 Dynasty Real Estate — HubSpot Setup');
  console.log('='.repeat(50));
  console.log(`Portal: ${process.env.HUBSPOT_PORTAL_ID ?? 'unknown'}`);

  await createPropertyGroups();
  await createContactProperties();
  await createPipeline();

  console.log('\n✅ Setup complete!\n');
}

main().catch(err => {
  console.error('\n💥 Fatal:', err.message ?? err);
  process.exit(1);
});
