import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type SessionRole = 'system' | 'user' | 'assistant' | 'tool';

export type AiSessionMessage = {
  role: SessionRole;
  content: string;
};

type AiSessionRecord = {
  sessionId: string;
  userId: string;
  organizationId: string;
  expiresAt: number;
  messages: AiSessionMessage[];
};

const SESSION_TTL_MS = 1000 * 60 * 30;
const MAX_MESSAGES = 18;

@Injectable()
export class AiSessionService {
  private readonly sessions = new Map<string, AiSessionRecord>();

  getOrCreateSession(userId: string, organizationId: string, sessionId?: string) {
    this.cleanupExpired();

    if (sessionId) {
      const existing = this.sessions.get(sessionId);
      if (
        existing &&
        existing.userId === userId &&
        existing.organizationId === organizationId
      ) {
        existing.expiresAt = Date.now() + SESSION_TTL_MS;
        return existing;
      }
    }

    const nextSessionId = `sess_${randomUUID()}`;
    const record: AiSessionRecord = {
      sessionId: nextSessionId,
      userId,
      organizationId,
      expiresAt: Date.now() + SESSION_TTL_MS,
      messages: [],
    };
    this.sessions.set(nextSessionId, record);
    return record;
  }

  appendMessage(
    userId: string,
    organizationId: string,
    sessionId: string,
    message: AiSessionMessage,
  ) {
    const session = this.getOrCreateSession(userId, organizationId, sessionId);
    session.messages.push(message);
    session.messages = session.messages.slice(-MAX_MESSAGES);
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    this.sessions.set(sessionId, session);
    return session;
  }

  clearSession(userId: string, organizationId: string, sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (
      session &&
      session.userId === userId &&
      session.organizationId === organizationId
    ) {
      this.sessions.delete(sessionId);
      return true;
    }

    return false;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
