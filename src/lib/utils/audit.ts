import { v4 as uuidv4 } from 'uuid';
import type { AuditLogEntry, AgentName } from '@/types/agent';

const auditLog: AuditLogEntry[] = []; // In production, persist to DB

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

  auditLog.push(entry);

  // In production: await db.auditLogs.insert(entry)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUDIT]', JSON.stringify(entry, null, 2));
  }

  return entry;
}

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog];
}
