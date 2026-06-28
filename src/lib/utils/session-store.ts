/**
 * Session Storage Adapter
 *
 * Uses Redis (via REDIS_URL env var) when available.
 * Falls back to in-memory Map for local development.
 * TTL: 2 hours (chat sessions are ephemeral).
 */

import type { SupervisorState } from '@/types/agent';

const SESSION_TTL_SECONDS = 7200; // 2 hours

// ─── In-memory fallback ───────────────────────────────────────────────────────

class MemoryStore {
  private store = new Map<string, { value: SupervisorState; expiresAt: number }>();

  async get(key: string): Promise<SupervisorState | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: SupervisorState, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    // Simple LRU eviction — keep max 5,000 sessions
    if (this.store.size > 5000) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// ─── Redis adapter ────────────────────────────────────────────────────────────

class RedisStore {
  private client: unknown = null;

  private async getClient() {
    if (!this.client) {
      const { createClient } = await import('redis');
      const client = createClient({ url: process.env.REDIS_URL });
      client.on('error', (err: Error) => console.error('[Redis]', err));
      await client.connect();
      this.client = client;
    }
    return this.client as {
      get: (key: string) => Promise<string | null>;
      setEx: (key: string, ttl: number, value: string) => Promise<unknown>;
      del: (key: string) => Promise<unknown>;
    };
  }

  async get(key: string): Promise<SupervisorState | null> {
    try {
      const client = await this.getClient();
      const raw = await client.get(`session:${key}`);
      return raw ? (JSON.parse(raw) as SupervisorState) : null;
    } catch (err) {
      console.error('[RedisStore] get failed:', err);
      return null;
    }
  }

  async set(key: string, value: SupervisorState, ttlSeconds: number): Promise<void> {
    try {
      const client = await this.getClient();
      await client.setEx(`session:${key}`, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error('[RedisStore] set failed:', err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(`session:${key}`);
    } catch (err) {
      console.error('[RedisStore] del failed:', err);
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _store: MemoryStore | RedisStore | null = null;

function getStore(): MemoryStore | RedisStore {
  if (!_store) {
    _store = process.env.REDIS_URL ? new RedisStore() : new MemoryStore();
    if (!process.env.REDIS_URL) {
      console.warn('[SessionStore] REDIS_URL not set — using in-memory store (not suitable for production)');
    }
  }
  return _store;
}

export async function getSession(sessionId: string): Promise<SupervisorState | null> {
  return getStore().get(sessionId);
}

export async function setSession(sessionId: string, state: SupervisorState): Promise<void> {
  return getStore().set(sessionId, state, SESSION_TTL_SECONDS);
}

export async function deleteSession(sessionId: string): Promise<void> {
  return getStore().del(sessionId);
}
