import { Capacitor } from '@capacitor/core';

export const PINS_DAEMON_PORT = 8000;
export const PINS_HOTSPOT_HOST = '10.42.0.1';
export const PINS_MDNS_SERVICE_TYPE = '_pinsdaemon._tcp';
export const DEFAULT_HEALTH_TIMEOUT_MS = 2200;

function asNonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

export function normalizeCandidateHost(value) {
  let candidate = asNonEmptyString(value);
  if (!candidate) return '';

  try {
    if (/^https?:\/\//i.test(candidate)) {
      candidate = new URL(candidate).hostname;
    }
  } catch {
    return '';
  }

  candidate = candidate
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .trim()
    .toLowerCase();
  if (!candidate || candidate.includes('/') || candidate.includes(' ')) return '';
  return candidate;
}

export function rigMdnsHost(rigId) {
  const normalized = normalizeCandidateHost(rigId);
  if (!normalized || normalized.includes(':') || normalized.endsWith('.local')) return normalized;
  return `${normalized}.local`;
}

function appendCandidate(target, seen, host, source) {
  const normalized = normalizeCandidateHost(host);
  if (!normalized || seen.has(normalized)) return;
  seen.add(normalized);
  target.push({ host: normalized, source });
}

/**
 * Candidate sources that are safe to race while the rig identity is still
 * unknown: the live endpoint, the address on the instance, the host the page
 * was served from, and the hotspot address - a phone can be attached to exactly
 * one rig's access point at a time.
 *
 * Everything else may point at a *different* machine. `mdns` returns every PINS
 * rig on the network, and `remembered` plus `preferred` are written by
 * promoteInstanceEndpoint(), so an earlier mis-promotion can have left another
 * rig's address there.
 */
export const USER_CONFIRMED_CANDIDATE_SOURCES = new Set([
  'active',
  'instance',
  'page',
  'field-hotspot',
]);

export function buildPinsEndpointCandidates({
  instance = null,
  currentHost = '',
  pageHost = '',
  mdnsHosts = [],
  includeFieldFallback = true,
  identityKnown = true,
} = {}) {
  const candidates = [];
  const seen = new Set();

  // Never replace a healthy live endpoint just because an alias for the same
  // Pi responds a few milliseconds faster.
  appendCandidate(candidates, seen, currentHost, 'active');
  if (identityKnown) {
    appendCandidate(candidates, seen, instance?.preferredEndpoint?.host, 'preferred');
  }
  appendCandidate(candidates, seen, instance?.ip, 'instance');
  if (identityKnown) {
    for (const host of instance?.candidateHosts || []) {
      appendCandidate(candidates, seen, host, 'remembered');
    }
  }
  appendCandidate(candidates, seen, pageHost, 'page');
  if (identityKnown) {
    appendCandidate(candidates, seen, rigMdnsHost(instance?.rigId), 'rig-mdns');
    for (const host of mdnsHosts) {
      appendCandidate(candidates, seen, host, 'mdns');
    }
  }

  if (includeFieldFallback) {
    appendCandidate(candidates, seen, PINS_HOTSPOT_HOST, 'field-hotspot');
  }

  return candidates;
}

function healthUrl(host) {
  const normalized = normalizeCandidateHost(host);
  const formattedHost = normalized.includes(':') ? `[${normalized}]` : normalized;
  return `http://${formattedHost}:${PINS_DAEMON_PORT}/health`;
}

function isValidHealth(payload) {
  return (
    payload &&
    payload.status === 'ok' &&
    payload.service === 'pinsdaemon' &&
    typeof payload.rigId === 'string' &&
    payload.rigId.trim().length > 0
  );
}

export async function probePinsHealth(
  candidate,
  { fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS, signal } = {}
) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch API is unavailable');
  }

  const host = normalizeCandidateHost(candidate?.host || candidate);
  if (!host) throw new Error('Invalid PINS endpoint candidate');

  const controller = new AbortController();
  const abortFromParent = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromParent();
  signal?.addEventListener?.('abort', abortFromParent, { once: true });
  const timeoutId = setTimeout(() => controller.abort('health-timeout'), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetchImpl(healthUrl(host), {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Health probe returned HTTP ${response.status}`);
    const health = await response.json();
    if (!isValidHealth(health)) throw new Error('Endpoint is not a compatible PINS daemon');
    return {
      host,
      source: candidate?.source || 'unknown',
      health,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener?.('abort', abortFromParent);
  }
}

export async function resolvePinsEndpoint({
  candidates,
  expectedRigId = '',
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS,
  signal,
  concurrency = 3,
} = {}) {
  const queue = Array.isArray(candidates) ? [...candidates] : [];
  const workerCount = Math.max(1, Math.min(Number(concurrency) || 1, queue.length || 1));
  let nextIndex = 0;
  let winner = null;
  const errors = [];

  async function worker() {
    while (!winner && nextIndex < queue.length && !signal?.aborted) {
      const candidate = queue[nextIndex++];
      try {
        const result = await probePinsHealth(candidate, { fetchImpl, timeoutMs, signal });
        if (expectedRigId && result.health.rigId !== expectedRigId) {
          errors.push({
            host: result.host,
            // Machine-readable: callers prune these hosts from the instance, and
            // must not do that for a plain timeout.
            reason: 'identity-mismatch',
            rigId: result.health.rigId,
            error: `Rig identity mismatch: expected ${expectedRigId}, received ${result.health.rigId}`,
          });
          continue;
        }
        winner = result;
      } catch (error) {
        errors.push({
          host: normalizeCandidateHost(candidate?.host || candidate),
          error: error?.message || String(error),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (winner) return { ...winner, attempts: errors };

  const failure = new Error(
    signal?.aborted ? 'PINS endpoint resolution cancelled' : 'No PINS endpoint responded'
  );
  failure.attempts = errors;
  throw failure;
}

function hostsFromMdnsService(service) {
  const txt = service?.txt || {};
  const hosts = Array.isArray(service?.hosts) ? service.hosts : [];
  return [txt.ip, ...hosts].map(normalizeCandidateHost).filter(Boolean);
}

export async function discoverPinsDaemonHosts({ timeout = 3500 } = {}) {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    const { mDNS } = await import('@acovanconis/capacitor-mdns');
    const result = await mDNS.discover({ type: PINS_MDNS_SERVICE_TYPE, timeout });
    if (result?.error || !Array.isArray(result?.services)) return [];
    return Array.from(new Set(result.services.flatMap(hostsFromMdnsService)));
  } catch (error) {
    console.warn('[RigEndpointResolver] PINS mDNS discovery failed:', error?.message || error);
    return [];
  }
}
