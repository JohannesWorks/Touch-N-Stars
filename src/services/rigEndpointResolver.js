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

// Under Capacitor window.location.hostname is always the WebView's own origin.
// A PINS daemon can never live there, so loopback must not enter the candidate
// list, become the "current host", or be promoted into the stored instance.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

export function isLoopbackHost(value) {
  return LOOPBACK_HOSTS.has(normalizeCandidateHost(value));
}

export function rigMdnsHost(rigId) {
  const normalized = normalizeCandidateHost(rigId);
  if (!normalized || normalized.includes(':') || normalized.endsWith('.local')) return normalized;
  return `${normalized}.local`;
}

function appendCandidate(target, seen, host, source) {
  const normalized = normalizeCandidateHost(host);
  if (!normalized || seen.has(normalized) || isLoopbackHost(normalized)) return;
  seen.add(normalized);
  target.push({ host: normalized, source });
}

export function buildPinsEndpointCandidates({
  instance = null,
  currentHost = '',
  pageHost = '',
  mdnsHosts = [],
  includeFieldFallback = true,
} = {}) {
  const candidates = [];
  const seen = new Set();

  // Never replace a healthy live endpoint just because an alias for the same
  // Pi responds a few milliseconds faster.
  appendCandidate(candidates, seen, currentHost, 'active');
  appendCandidate(candidates, seen, instance?.preferredEndpoint?.host, 'preferred');
  appendCandidate(candidates, seen, instance?.ip, 'instance');
  for (const host of instance?.candidateHosts || []) {
    appendCandidate(candidates, seen, host, 'remembered');
  }
  appendCandidate(candidates, seen, pageHost, 'page');
  appendCandidate(candidates, seen, rigMdnsHost(instance?.rigId), 'rig-mdns');
  for (const host of mdnsHosts) {
    appendCandidate(candidates, seen, host, 'mdns');
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

// rigId is only reported by daemons that also implement the network-mode API.
// Requiring it here would make every probe against an older daemon fail, so it
// stays optional and is used for identity matching alone.
function isValidHealth(payload) {
  return payload && payload.status === 'ok' && payload.service === 'pinsdaemon';
}

export function healthRigId(health) {
  return asNonEmptyString(health?.rigId);
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
        const reportedRigId = healthRigId(result.health);
        // A daemon that reports no identity cannot be rejected for having the
        // wrong one — reachable is the best signal we have on older versions.
        if (expectedRigId && reportedRigId && reportedRigId !== expectedRigId) {
          errors.push({
            host: result.host,
            error: `Rig identity mismatch: expected ${expectedRigId}, received ${reportedRigId}`,
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

// Resolves to `fallback` once `ms` have passed or `signal` aborts, whichever comes
// first. Never rejects: the caller wants to move on, not to handle another error.
function settleAfter(ms, signal, fallback) {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', done);
      resolve(fallback);
    };
    const timer = setTimeout(done, ms);
    if (signal?.aborted) return done();
    signal?.addEventListener?.('abort', done, { once: true });
  });
}

// The native mDNS plugin owns its own timeout, but a scan that is cancelled by a
// concurrent one can stop reporting back entirely. Discovery is an optimisation,
// so it is raced against a hard deadline - a stuck scan must never stall the
// recovery loop, which would leave the PINS screen disabled indefinitely.
export async function discoverPinsDaemonHosts({ timeout = 3500, signal } = {}) {
  if (!Capacitor.isNativePlatform()) return [];

  const discover = (async () => {
    try {
      const { mDNS } = await import('@acovanconis/capacitor-mdns');
      const result = await mDNS.discover({ type: PINS_MDNS_SERVICE_TYPE, timeout });
      if (result?.error || !Array.isArray(result?.services)) return [];
      return Array.from(new Set(result.services.flatMap(hostsFromMdnsService)));
    } catch (error) {
      console.warn('[RigEndpointResolver] PINS mDNS discovery failed:', error?.message || error);
      return [];
    }
  })();

  return Promise.race([discover, settleAfter(timeout + 1500, signal, [])]);
}
