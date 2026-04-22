import fs from 'fs';

export type AuditEvent =
  | 'NODE_CREATE'
  | 'NODE_UPDATE'
  | 'NODE_DELETE'
  | 'RELATIONSHIP_CREATE'
  | 'RELATIONSHIP_DELETE'
  | 'DOCUMENT_CREATE'
  | 'DOCUMENT_UPDATE'
  | 'DOCUMENT_DELETE'
  | 'ROW_INSERT'
  | 'ROW_UPDATE'
  | 'ROW_DELETE';

interface AuditEntry {
  timestamp: string;
  event: AuditEvent;
  label: string;
  params: Record<string, any>;
  source: string;
}

const SENSITIVE = ['password', 'token', 'secret', 'email'];

function redact(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = SENSITIVE.some(s => key.toLowerCase().includes(s)) ? '[REDACTED]' : value;
  }
  return result;
}

export function audit(entry: AuditEntry): void {
  const line = JSON.stringify({ ...entry, params: redact(entry.params) });
  console.log(`[AUDIT] ${line}`);
  const logPath = process.env.AUDIT_LOG_PATH;
  if (logPath) fs.appendFileSync(logPath, line + '\n');
}