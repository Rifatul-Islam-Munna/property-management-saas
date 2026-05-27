import type { INestApplication } from '@nestjs/common';
import { createDevLogger, isDevLoggingEnabled, stringifyForDevLog } from './dev-logging.util';

const WRAPPED_FLAG = Symbol('devRuntimeMethodWrapped');

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as Promise<unknown>).then === 'function';
}

function wrapInstanceMethods(instance: Record<string, any>, layer: 'Controller' | 'Service') {
  if (!instance || typeof instance !== 'object') return;

  const prototype = Object.getPrototypeOf(instance);
  if (!prototype) return;

  for (const methodName of Object.getOwnPropertyNames(prototype)) {
    if (methodName === 'constructor') continue;
    if (typeof instance[methodName] !== 'function') continue;
    if (instance[methodName][WRAPPED_FLAG]) continue;

    const original = instance[methodName].bind(instance);
    const className = instance.constructor?.name ?? 'UnknownClass';
    const logger = createDevLogger(`${className}`);

    const wrapped = (...args: unknown[]) => {
      const startedAt = Date.now();
      logger.log(`[${layer}:${className}] [Method:${methodName}] [START] args=${stringifyForDevLog(args)}`);

      try {
        const result = original(...args);

        if (isPromiseLike(result)) {
          return result
            .then((resolved) => {
              logger.log(`[${layer}:${className}] [Method:${methodName}] [END] durationMs=${Date.now() - startedAt} result=${stringifyForDevLog(resolved)}`);
              return resolved;
            })
            .catch((error: any) => {
              logger.error(`[${layer}:${className}] [Method:${methodName}] [ERROR] durationMs=${Date.now() - startedAt} message=${error?.message ?? 'Unknown error'}`);
              throw error;
            });
        }

        logger.log(`[${layer}:${className}] [Method:${methodName}] [END] durationMs=${Date.now() - startedAt} result=${stringifyForDevLog(result)}`);
        return result;
      } catch (error: any) {
        logger.error(`[${layer}:${className}] [Method:${methodName}] [ERROR] durationMs=${Date.now() - startedAt} message=${error?.message ?? 'Unknown error'}`);
        throw error;
      }
    };

    (wrapped as any)[WRAPPED_FLAG] = true;
    instance[methodName] = wrapped;
  }
}

export function attachDevRuntimeMethodLogging(app: INestApplication) {
  if (!isDevLoggingEnabled()) return;

  const container = (app as any)?.container;
  const modules = container?.getModules?.();
  if (!modules) return;

  for (const [, moduleRef] of modules) {
    for (const [, wrapper] of moduleRef.providers ?? []) {
      const className = wrapper?.instance?.constructor?.name ?? '';
      if (!className.endsWith('Service')) continue;
      wrapInstanceMethods(wrapper?.instance, 'Service');
    }
  }
}
