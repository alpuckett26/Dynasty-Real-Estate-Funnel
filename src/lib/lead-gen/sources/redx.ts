/**
 * REDX CSV import.
 *
 * REDX sells contact data for FSBO, expired listings, FRBO and pre-foreclosure
 * — the same lead types the dead Craigslist/FSBO.com scrapers were trying to
 * produce for free. Export columns differ per lead type and change over time,
 * so headers are matched loosely rather than by exact position.
 *
 * These are PURCHASED COLD RECORDS, not inbound leads. They must be worked by
 * phone: the numbers have not consented to automated marketing texts, so this
 * path deliberately creates a call task instead of sending SMS.
 */

export interface RedxLead {
  firstName?: string;
  lastName?: string;
  phones: string[];
  email?: string;
  propertyAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  /** FSBO, Expired, FRBO, Pre-Foreclosure — from the export or the filename. */
  leadType: string;
  /** Anything else worth putting on the CRM note. */
  extra: Record<string, string>;
}

/** Minimal RFC-4180 CSV parser — handles quoted fields and embedded commas. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const text = input.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Find the first column whose normalised header matches any candidate. */
function pick(headers: string[], candidates: string[]): number {
  const normalised = headers.map(norm);
  for (const c of candidates) {
    const i = normalised.indexOf(norm(c));
    if (i !== -1) return i;
  }
  // Fall back to a contains-match, e.g. "Owner First Name" for "first name".
  for (const c of candidates) {
    const i = normalised.findIndex((h) => h.includes(norm(c)));
    if (i !== -1) return i;
  }
  return -1;
}

/** US 10-digit normalisation; returns null for anything unusable. */
export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export function parseRedxCsv(csv: string, defaultLeadType = 'FSBO'): RedxLead[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const idx = {
    first: pick(headers, ['first name', 'firstname', 'owner first name', 'owner first']),
    last: pick(headers, ['last name', 'lastname', 'owner last name', 'owner last']),
    full: pick(headers, ['name', 'owner name', 'full name', 'contact name']),
    email: pick(headers, ['email', 'email address', 'owner email']),
    address: pick(headers, ['address', 'property address', 'street address', 'street']),
    city: pick(headers, ['city']),
    state: pick(headers, ['state', 'st']),
    zip: pick(headers, ['zip', 'zip code', 'postal code']),
    type: pick(headers, ['lead type', 'type', 'status', 'category']),
  };

  // Any column that looks like a phone — REDX exports several.
  const phoneCols = headers
    .map((h, i) => ({ h: norm(h), i }))
    .filter(({ h }) => h.includes('phone') || h.includes('mobile') || h.includes('cell') || h.includes('landline'))
    .map(({ i }) => i);

  const leads: RedxLead[] = [];

  for (const row of rows.slice(1)) {
    const cell = (i: number) => (i >= 0 && i < row.length ? (row[i] ?? '').trim() : '');

    let firstName = cell(idx.first);
    let lastName = cell(idx.last);
    if (!firstName && !lastName && idx.full >= 0) {
      const parts = cell(idx.full).split(/\s+/).filter(Boolean);
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ');
    }

    const phones = [...new Set(phoneCols.map((i) => normalizePhone(cell(i))).filter((p): p is string => !!p))];
    const email = cell(idx.email) || undefined;

    // Unusable without a way to reach them.
    if (!phones.length && !email) continue;

    const extra: Record<string, string> = {};
    headers.forEach((h, i) => {
      const key = norm(h);
      if (!h || phoneCols.includes(i)) return;
      if ([idx.first, idx.last, idx.full, idx.email, idx.address, idx.city, idx.state, idx.zip].includes(i)) return;
      const v = cell(i);
      if (v && key) extra[h.trim()] = v;
    });

    leads.push({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phones,
      email,
      propertyAddress: cell(idx.address) || undefined,
      city: cell(idx.city) || undefined,
      state: cell(idx.state) || undefined,
      zip: cell(idx.zip) || undefined,
      leadType: cell(idx.type) || defaultLeadType,
      extra,
    });
  }

  return leads;
}
