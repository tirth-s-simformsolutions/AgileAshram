import { AsyncLocalStorage } from 'async_hooks';
import * as crypto from 'crypto';
import * as os from 'os';
import { SENSITIVE_KEYS } from '../constants';
import { sanitize } from './common.util';

interface RequestContext {
  traceId: string;
  startTime: number;
  method?: string;
  originalUrl?: string;
  ip?: string;
  userAgent?: string;
  server?: string;
  requestBody?: unknown;
  userId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const asyncContext = {
  run(callback: () => void) {
    const context: RequestContext = {
      traceId: crypto.randomUUID(),
      startTime: Date.now(),
      server: os.hostname(),
    };
    asyncLocalStorage.run(context, callback);
  },

  setRequestInfo(
    method: string,
    originalUrl: string,
    ip: string,
    userAgent: string,
    requestBody?: unknown,
  ) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.method = method;
      store.originalUrl = originalUrl;
      store.ip = ip;
      store.userAgent = userAgent;
      store.requestBody = requestBody;
    }
  },

  getRequestInfo(): {
    method?: string;
    originalUrl?: string;
    ip?: string;
    userAgent?: string;
    server?: string;
    requestBody?: unknown;
    userId?: string;
  } {
    const store = asyncLocalStorage.getStore();
    return {
      method: store?.method,
      originalUrl: store?.originalUrl,
      ip: store?.ip,
      userAgent: store?.userAgent,
      server: store?.server,
      requestBody: store?.requestBody ? sanitize(store.requestBody, SENSITIVE_KEYS) : null,
      userId: store?.userId,
    };
  },

  setUser(userId: string) {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.userId = userId;
    }
  },

  getTraceId(): string {
    return asyncLocalStorage.getStore()?.traceId ?? 'unknown-trace';
  },

  getDuration(): number | null {
    const store = asyncLocalStorage.getStore();
    return store ? Date.now() - store.startTime : null;
  },
};
