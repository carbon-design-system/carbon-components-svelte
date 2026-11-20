// @ts-check
import { parseQuery } from "../TokenSearch/token-query.js";

/**
 * @typedef {import("./audit-source.js").AuditEvent} AuditEvent
 * @typedef {import("./audit-source.js").AuditQuery} AuditQuery
 * @typedef {import("./audit-source.js").AuditPage} AuditPage
 * @typedef {import("./audit-source.js").AuditSource} AuditSource
 */

export const ACTORS = (() => {
  const first = [
    "alice",
    "bashir",
    "chen",
    "dalia",
    "emeka",
    "farah",
    "gustavo",
    "hana",
    "ivan",
    "jin",
    "kaito",
    "lena",
    "mateo",
    "nadia",
    "omar",
    "priya",
    "quinn",
    "rosa",
    "sven",
    "tomas",
    "uma",
    "viktor",
    "wen",
    "yusuf",
  ];
  const last = [
    "adams",
    "brandt",
    "cruz",
    "dube",
    "eze",
    "fox",
    "gupta",
    "han",
  ];
  const out = [];
  for (const f of first) for (const l of last) out.push(`${f}.${l}@acme.test`);
  out.push(
    "svc-ci",
    "svc-backup",
    "svc-deploy",
    "svc-monitor",
    "svc-billing",
    "svc-search",
    "svc-etl",
    "root",
  );
  return out;
})();

export const ACTIONS = [
  "iam.user.login",
  "iam.user.logout",
  "iam.policy.update",
  "iam.role.create",
  "iam.role.delete",
  "iam.key.rotate",
  "iam.mfa.disable",
  "storage.object.read",
  "storage.object.write",
  "storage.object.delete",
  "storage.bucket.create",
  "storage.bucket.policy",
  "compute.instance.create",
  "compute.instance.start",
  "compute.instance.stop",
  "compute.instance.delete",
  "network.firewall.update",
  "network.vpc.create",
  "db.cluster.create",
  "db.cluster.restore",
  "db.snapshot.delete",
  "secret.value.read",
  "secret.value.update",
  "billing.plan.change",
];

export const OUTCOMES = /** @type {const} */ (["success", "failure", "denied"]);

const KINDS = [
  "bucket",
  "instance",
  "role",
  "key",
  "secret",
  "db",
  "cluster",
  "user",
];
const REGIONS = ["us-south", "us-east", "eu-de", "eu-gb", "jp-tok", "au-syd"];
const AGENTS = [
  "console/4.12",
  "cli/2.8.1",
  "terraform/1.9",
  "sdk-go/1.40",
  "sdk-python/3.2",
  "curl/8.4",
];

const CURSOR_PREFIX = /^c:/;
const TARGET_COUNT = 3000;
const IP_COUNT = 1500;
const DAY = 86_400_000;

/** @param {number} i */
function targetName(i) {
  return `${KINDS[i % KINDS.length]}/${String(Math.floor(i / KINDS.length)).padStart(4, "0")}`;
}

/** @param {number} i */
function ipName(i) {
  return `10.${(i * 7) % 256}.${Math.floor(i / 6) % 256}.${((i * 13 + 5) % 254) + 1}`;
}

export const TARGETS = Array.from({ length: TARGET_COUNT }, (_, i) =>
  targetName(i),
);
export const IPS = Array.from({ length: IP_COUNT }, (_, i) => ipName(i));

/** @param {number} x */
function mix(x) {
  const a = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  const b = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  return (b ^ (b >>> 16)) >>> 0;
}

/**
 * The five fields of event `s` as dictionary codes. Pure: the same `seed` and
 * `s` always give the same codes.
 *
 * @param {number} seed
 * @param {number} s
 * @returns {[number, number, number, number, number, number]} actor, action, outcome, target, ip, raw hash
 */
function codesAt(seed, s) {
  const h = mix(seed ^ Math.imul(s + 1, 0x9e3779b1));
  const h2 = mix(h ^ 0x85ebca6b);
  const h3 = mix(h2 ^ 0xc2b2ae35);
  const h4 = mix(h3 ^ 0x27d4eb2f);
  const u = h / 4294967296;
  const v = h2 / 4294967296;
  const actor = Math.floor(u * u * ACTORS.length);
  const action = Math.floor(v * v * ACTIONS.length);
  const r = (h3 % 1000) / 1000;
  const outcome = r < 0.92 ? 0 : r < 0.97 ? 1 : 2;
  const target = h4 % TARGET_COUNT;
  const ip = mix(h4 ^ actor) % IP_COUNT;
  return [actor, action, outcome, target, ip, h4];
}

/**
 * @param {number} seed
 * @param {number} s
 * @param {number} time epoch ms
 * @param {number[]} codes
 * @returns {AuditEvent}
 */
function buildEvent(seed, s, time, codes) {
  const [actor, action, outcome, target, ip, h] = codes;
  const actionName = ACTIONS[action];
  const region = REGIONS[h % REGIONS.length];
  const method =
    actionName.endsWith(".read") || actionName.endsWith(".login")
      ? "GET"
      : "POST";
  /** @type {Record<string, unknown>} */
  const request = {
    method,
    path: `/v2/${actionName.split(".").slice(0, 2).join("/")}/${TARGETS[target].split("/")[1]}`,
    params: {
      region,
      dryRun: h % 17 === 0,
      tags: [`team-${h % 5}`, `env-${["dev", "stage", "prod"][h % 3]}`],
    },
  };
  /** @type {Record<string, unknown>} */
  const payload = {
    requestId: `req-${mix(h ^ seed)
      .toString(16)
      .padStart(8, "0")}`,
    userAgent: AGENTS[h % AGENTS.length],
    region,
    auth: {
      type: ACTORS[actor].startsWith("svc-") ? "service-account" : "user",
      mfa: h % 4 !== 0,
      session: {
        issuedAt: new Date(time - (h % 3600) * 1000).toISOString(),
        scopes: ["read", "write"].slice(0, 1 + (h % 2)),
      },
    },
    request,
    response: {
      status: outcome === 0 ? 200 : outcome === 1 ? 500 : 403,
      latencyMs: 5 + (h % 400),
    },
  };
  if (outcome === 1)
    payload.error = { code: "InternalError", retryable: h % 2 === 0 };
  if (outcome === 2)
    payload.error = {
      code: "AccessDenied",
      requiredRole: `role/${KINDS[h % 3]}-admin`,
    };
  return {
    id: `evt_${s.toString(16).padStart(8, "0")}`,
    time: new Date(time).toISOString(),
    actor: ACTORS[actor],
    action: actionName,
    target: TARGETS[target],
    outcome: OUTCOMES[outcome],
    ip: IPS[ip],
    payload,
  };
}

/** The facet fields the source can count, by dictionary. */
const DICTS = /** @type {const} */ ({
  actor: ACTORS,
  action: ACTIONS,
  outcome: OUTCOMES,
  target: TARGETS,
  ip: IPS,
});
const FIELDS = /** @type {const} */ ([
  "actor",
  "action",
  "outcome",
  "target",
  "ip",
]);
/** Where each field sits in a `codesAt` tuple. */
const SLOT = { actor: 0, action: 1, outcome: 2, target: 3, ip: 4 };
/** Fields whose qualifier is an exact match; the others are a substring match. */
const EXACT = new Set(["actor", "action", "outcome"]);

/**
 * @param {string} message
 */
function abortError(message = "Aborted") {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

/**
 * An in-memory `AuditSource` over `size` synthetic events. Nothing is stored
 * per event: every field is a function of the event's position, so a million
 * events cost five typed columns (about 7 MB), built on the first query, and an
 * event object is made only for the page that is returned.
 *
 * @param {{
 *   size?: number,
 *   seed?: number,
 *   now?: number,
 *   spanDays?: number,
 *   latency?: number,
 *   liveRate?: number,
 * }} [options] `size` events spread over `spanDays` ending at `now`.
 *   `latency` is the simulated round trip in ms. `liveRate` is events per second of the tail.
 * @returns {AuditSource & { size: number, columnsBuilt: () => boolean }}
 */
export function createMemorySource(options = {}) {
  const size = options.size ?? 1_000_000;
  const seed = options.seed ?? 0x5eed;
  const now = options.now ?? Date.now();
  const spanMs = (options.spanDays ?? 30) * DAY;
  const latency = options.latency ?? 0;
  const liveRate = options.liveRate ?? 20;
  const step = Math.max(2, Math.floor(spanMs / Math.max(1, size)));
  const start = now - size * step;

  /** @type {Uint8Array | undefined} */
  let cActor;
  /** @type {Uint8Array | undefined} */
  let cAction;
  /** @type {Uint8Array | undefined} */
  let cOutcome;
  /** @type {Uint16Array | undefined} */
  let cTarget;
  /** @type {Uint16Array | undefined} */
  let cIp;

  /** Events the tail has produced, in order: position `size + i`. */
  /** @type {{ time: number, codes: number[] }[]} */
  const live = [];

  /** @param {number} s */
  function baseTime(s) {
    return start + s * step + (mix(seed ^ (s * 31)) % (step - 1));
  }

  /** @param {number} s */
  function timeAt(s) {
    return s < size ? baseTime(s) : (live[s - size]?.time ?? now);
  }

  function total() {
    return size + live.length;
  }

  function buildColumns() {
    if (cActor) return;
    const a = new Uint8Array(size);
    const b = new Uint8Array(size);
    const o = new Uint8Array(size);
    const t = new Uint16Array(size);
    const p = new Uint16Array(size);
    for (let s = 0; s < size; s++) {
      const c = codesAt(seed, s);
      a[s] = c[0];
      b[s] = c[1];
      o[s] = c[2];
      t[s] = c[3];
      p[s] = c[4];
    }
    cActor = a;
    cAction = b;
    cOutcome = o;
    cTarget = t;
    cIp = p;
  }

  /**
   * The first position at or after `ms`.
   * @param {number} ms
   */
  function lowerBound(ms) {
    let lo = 0;
    let hi = total();
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (timeAt(mid) < ms) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /**
   * Turn a query into tests over codes.
   * @param {AuditQuery} query
   */
  function compile(query) {
    const terms = parseQuery(query.q || "").terms.slice(0, 30);
    /** @type {Record<string, Uint8Array | null>} */
    const own = {
      actor: null,
      action: null,
      outcome: null,
      target: null,
      ip: null,
    };
    let impossible = false;
    for (const filter of query.filters) {
      const field = /** @type {keyof typeof DICTS} */ (
        filter.key.toLowerCase()
      );
      if (!(field in DICTS)) continue;
      const dict = DICTS[field];
      const table = new Uint8Array(dict.length);
      if (filter.op !== "eq") {
        impossible = true;
        continue;
      }
      const wanted = filter.values.map((v) => v.toLowerCase());
      for (let i = 0; i < dict.length; i++) {
        const name = String(dict[i]).toLowerCase();
        const hit = wanted.some((w) =>
          EXACT.has(field) ? name === w : name.includes(w),
        );
        table[i] = hit === filter.negated ? 0 : 1;
      }
      const prev = own[field];
      if (prev) for (let i = 0; i < table.length; i++) table[i] &= prev[i];
      own[field] = table;
    }
    let pos = 0;
    let neg = 0;
    terms.forEach((term, i) => {
      if (term.negated) neg |= 1 << i;
      else pos |= 1 << i;
    });
    /** @type {Record<string, Uint32Array>} */
    const masks = {};
    if (terms.length > 0) {
      for (const field of FIELDS) {
        const dict = DICTS[field];
        const m = new Uint32Array(dict.length);
        for (let i = 0; i < dict.length; i++) {
          const name = String(dict[i]).toLowerCase();
          let bits = 0;
          for (let k = 0; k < terms.length; k++) {
            if (name.includes(terms[k].text.toLowerCase())) bits |= 1 << k;
          }
          m[i] = bits;
        }
        masks[field] = m;
      }
    }
    const from = query.range.from
      ? Date.parse(query.range.from)
      : Number.NEGATIVE_INFINITY;
    const to = query.range.to
      ? Date.parse(query.range.to)
      : Number.POSITIVE_INFINITY;
    return {
      own,
      pos,
      neg,
      masks,
      hasText: terms.length > 0,
      impossible,
      from,
      to,
    };
  }

  /**
   * Whether the codes pass the text and the filters of fields not in `except`.
   * @param {ReturnType<typeof compile>} c
   * @param {ArrayLike<number>} codes actor, action, outcome, target, ip
   */
  function passes(c, codes) {
    if (c.hasText) {
      const m = c.masks;
      const bits =
        m.actor[codes[0]] |
        m.action[codes[1]] |
        m.outcome[codes[2]] |
        m.target[codes[3]] |
        m.ip[codes[4]];
      if ((bits & c.pos) !== c.pos || (bits & c.neg) !== 0) return false;
    }
    const { own } = c;
    return (
      (!own.target || own.target[codes[3]] === 1) &&
      (!own.ip || own.ip[codes[4]] === 1)
    );
  }

  /** @param {ReturnType<typeof compile>} c @param {ArrayLike<number>} codes */
  function ownPass(c, codes) {
    const { own } = c;
    return (
      (!own.actor || own.actor[codes[0]] === 1) &&
      (!own.action || own.action[codes[1]] === 1) &&
      (!own.outcome || own.outcome[codes[2]] === 1)
    );
  }

  /** @param {number} s */
  function eventAt(s) {
    if (s < size) return buildEvent(seed, s, baseTime(s), codesAt(seed, s));
    const item = live[s - size];
    return buildEvent(seed, s, item.time, item.codes);
  }

  /** @param {AbortSignal | undefined} signal */
  function wait(signal) {
    if (signal?.aborted) return Promise.reject(abortError());
    return new Promise((resolve, reject) => {
      const done = () => {
        signal?.removeEventListener("abort", onAbort);
        resolve(undefined);
      };
      const onAbort = () => {
        clearTimeout(timer);
        reject(abortError());
      };
      const timer = setTimeout(done, latency);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  /** @type {AuditSource["query"]} */
  async function query(q) {
    await wait(q.signal);
    buildColumns();
    const c = compile(q);
    const limit = Math.max(1, Math.min(1000, Math.floor(q.limit) || 50));
    const top = total();
    let hi = top - 1;
    if (q.cursor) {
      const at = Number(String(q.cursor).replace(CURSOR_PREFIX, ""));
      if (Number.isFinite(at)) hi = Math.min(hi, at - 1);
    }
    const lo = lowerBound(c.from);
    const upper =
      c.to === Number.POSITIVE_INFINITY ? top - 1 : lowerBound(c.to + 1) - 1;
    hi = Math.min(hi, upper);
    /** @type {AuditEvent[]} */
    const events = [];
    let last = -1;
    const scratch = [0, 0, 0, 0, 0];
    /**
     * The codes of position `s`, in a reused array.
     * @param {number} s
     */
    const read = (s) => {
      if (s < size) {
        scratch[0] = /** @type {Uint8Array} */ (cActor)[s];
        scratch[1] = /** @type {Uint8Array} */ (cAction)[s];
        scratch[2] = /** @type {Uint8Array} */ (cOutcome)[s];
        scratch[3] = /** @type {Uint16Array} */ (cTarget)[s];
        scratch[4] = /** @type {Uint16Array} */ (cIp)[s];
        return scratch;
      }
      return live[s - size].codes;
    };
    if (!c.impossible) {
      for (let s = hi; s >= lo; s--) {
        const codes = read(s);
        if (!passes(c, codes) || !ownPass(c, codes)) continue;
        events.push(eventAt(s));
        last = s;
        if (events.length >= limit) break;
      }
    }
    /** @type {AuditPage} */
    const page = {
      events,
      nextCursor: events.length >= limit && last > lo ? `c:${last}` : null,
    };
    if (!q.cursor) {
      const wanted = /** @type {Array<"actor" | "action" | "outcome">} */ (
        (q.facets ?? []).filter(
          (f) => f === "actor" || f === "action" || f === "outcome",
        )
      );
      /** @type {Record<string, Uint32Array>} */
      const tallies = {};
      for (const f of wanted) tallies[f] = new Uint32Array(DICTS[f].length);
      const { own } = c;
      let count = 0;
      if (!c.impossible) {
        const end = Math.min(upper, top - 1);
        for (let s = end; s >= lo; s--) {
          const codes = read(s);
          if (!passes(c, codes)) continue;
          // How many of the facets' own filters this event fails, and which.
          const failA = own.actor !== null && own.actor[codes[0]] !== 1;
          const failB = own.action !== null && own.action[codes[1]] !== 1;
          const failC = own.outcome !== null && own.outcome[codes[2]] !== 1;
          const fails = (failA ? 1 : 0) + (failB ? 1 : 0) + (failC ? 1 : 0);
          if (fails > 1) continue;
          if (fails === 0) count++;
          for (const f of wanted) {
            if (fails === 1) {
              const failedHere =
                (f === "actor" && failA) ||
                (f === "action" && failB) ||
                (f === "outcome" && failC);
              if (!failedHere) continue;
            }
            tallies[f][codes[SLOT[f]]]++;
          }
        }
      }
      /** @type {Record<string, Record<string, number>>} */
      const facets = {};
      for (const f of wanted) {
        /** @type {Record<string, number>} */
        const out = {};
        const tally = tallies[f];
        for (let i = 0; i < tally.length; i++) {
          if (tally[i] > 0) out[String(DICTS[f][i])] = tally[i];
        }
        facets[f] = out;
      }
      page.total = count;
      page.facets = facets;
    }
    return page;
  }

  /** @type {Set<{ test: (codes: number[], time: number) => boolean, push: (events: AuditEvent[]) => void }>} */
  const subscribers = new Set();
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let timer;
  let startedAt = 0;
  let emitted = 0;

  function tick() {
    const due =
      Math.floor(((Date.now() - startedAt) / 1000) * liveRate) - emitted;
    if (due <= 0) return;
    /** @type {{ s: number, time: number, codes: number[] }[]} */
    const batch = [];
    const nowMs = Date.now();
    for (let i = 0; i < due; i++) {
      const s = size + live.length;
      const c = codesAt(seed, s);
      // Spread the batch over the gap so times stay distinct and ordered.
      const time = Math.max(
        nowMs - Math.floor(((due - 1 - i) * 1000) / liveRate),
        timeAt(s - 1) + 1,
      );
      const item = { time, codes: c };
      live.push(item);
      batch.push({ s, time, codes: item.codes });
    }
    emitted += due;
    for (const sub of subscribers) {
      const hits = batch
        .filter((b) => sub.test(b.codes, b.time))
        .map((b) => buildEvent(seed, b.s, b.time, b.codes));
      if (hits.length) sub.push(hits);
    }
  }

  /** @type {NonNullable<AuditSource["tail"]>} */
  function tail(q, { onEvents, signal }) {
    const c = compile(q);
    const sub = {
      test: (/** @type {number[]} */ codes, /** @type {number} */ time) =>
        !c.impossible &&
        passes(c, codes) &&
        ownPass(c, codes) &&
        time >= c.from &&
        time <= c.to,
      push: onEvents,
    };
    if (signal.aborted) return;
    subscribers.add(sub);
    if (subscribers.size === 1) {
      startedAt = Date.now();
      emitted = 0;
      timer = setInterval(tick, 50);
    }
    signal.addEventListener(
      "abort",
      () => {
        subscribers.delete(sub);
        if (subscribers.size === 0 && timer !== undefined) {
          clearInterval(timer);
          timer = undefined;
        }
      },
      { once: true },
    );
  }

  return { size, query, tail, columnsBuilt: () => cActor !== undefined };
}
