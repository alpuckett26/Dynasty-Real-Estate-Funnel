/**
 * Audit Log Adapter
 *
 * Persists to a newline-delimited JSON file in /tmp/audit when FILE_AUDIT_LOG=true,
 * or to a Postgres DB when DATABASE_URL is set (via direct pg insert).
 * Falls back to in-memory for local dev without either env var.
 *
 * Every agent invocation is logged here for compliance.
 */

import { v4 as uuidv4 } from 'uuid';
import type { AuditLogEntry, AgentName } from '@/types/agent';

// ─── In-memory fallback ───────────────────────────────────────────────────────
const memoryLog: AuditLogEntry[] = [];

// ─── File-based persistence ───────────────────────────────────────────────────
async function appendToFile(entry: AuditLogEntry): Promise<void> {
  try {
    const { appendFile, mkdir } = await import('fs/promises');
    const dir = '/tmp/dynasty-audit';
    await mkdir(dir, { recursive: true });
    const date = entry.timestamp.slice(0, 10); // YYYY-MM-DD
    await appendFile(`${dir}/${date}.ndjson`, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    console.error('[Audit] File write failed:', err);
  }
}

// ─── Postgres persistence ─────────────────────────────────────────────────────
async function insertToPostgres(entry: AuditLogEntry): Promise<void> {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(
      `INSERT INTO audit_logs
         (id, session_id, agent, input_summary, output_summary, timestamp, duration_ms, guardrail_flags, human_review_required)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        entry.id,
        entry.sessionId,
        entry.agent,
        entry.inputSummary,
        entry.outputSummary,
        entry.timestamp,
        entry.durationMs,
        JSON.stringify(entry.guardrailFlags),
        entry.humanReviewRequired,
      ]
    );
    await pool.end();
  } catch (err) {
    console.error('[Audit] Postgres insert failed:', err);
    memoryLog.push(entry); // fall back to memory on DB error
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createAuditEntry(params: {
  sessionId: string;
  agent: AgentName | 'supervisor';
  inputSummary: string;
  outputSummary: string;
  startTime: number;
  guardrailFlags?: string[];
  humanReviewRequired?: boolean;
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: uuidv4(),
    sessionId: params.sessionId,
    agent: params.agent,
    inputSummary: params.inputSummary,
    outputSummary: params.outputSummary,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - params.startTime,
    guardrailFlags: params.guardrailFlags ?? [],
    humanReviewRequired: params.humanReviewRequired ?? false,
  };

  // Always push to memory for getAuditLog() to work within the same process
  memoryLog.push(entry);
  if (memoryLog.length > 10_000) memoryLog.shift(); // cap at 10k in-memory

  // Log to console in dev
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUDIT]', entry.agent, entry.sessionId, `${entry.durationMs}ms`,
      entry.guardrailFlags.length ? `⚠️ ${entry.guardrailFlags.join(',')}` : '✅');
  }

  // Persist asynchronously — don't block the request
  if (process.env.DATABASE_URL) {
    insertToPostgres(entry).catch(console.error);
  } else if (process.env.FILE_AUDIT_LOG === 'true') {
    appendToFile(entry).catch(console.error);
  }

  // Alert on any entry requiring human review
  if (entry.humanReviewRequired && process.env.NODE_ENV === 'production') {
    console.error('[AUDIT] ⚠️ HUMAN REVIEW REQUIRED', entry.id, entry.agent, entry.guardrailFlags);
  }

  return entry;
}

export function getAuditLog(): AuditLogEntry[] {
  return [...memoryLog];
}

export function getAuditLogBySession(sessionId: string): AuditLogEntry[] {
  return memoryLog.filter((e) => e.sessionId === sessionId);
}

export function getFlaggedEntries(): AuditLogEntry[] {
  return memoryLog.filter((e) => e.humanReviewRequired || e.guardrailFlags.length > 0);
}
