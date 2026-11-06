// @ts-check
// The catalog the examples browse: a seeded list of services, software and
// templates, and the facets and sorts the page offers over it.

import { defineFacets } from "../../../src/FilterPanel/filter-model.js";

export const CATEGORIES = [
  "AI and machine learning",
  "Analytics",
  "Compute",
  "Containers",
  "Databases",
  "Developer tools",
  "Integration",
  "Networking",
  "Security",
  "Storage",
];

export const TYPES = ["Service", "Software", "Template"];

export const PRICING = ["Free", "Free tier", "Paid", "Contact sales"];

export const RATING_BANDS = [
  { id: "top", label: "4.5 and up" },
  { id: "good", label: "4.0 to 4.4" },
  { id: "fair", label: "Under 4.0" },
];

/** The sorts, in menu order. `relevance` is the default; it means "most popular" without a query. */
export const SORTS = [
  { id: "relevance", text: "Relevance" },
  { id: "name", text: "Name (A to Z)" },
  { id: "newest", text: "Recently updated" },
  { id: "rating", text: "Highest rated" },
];

const PREFIXES = [
  "Cloud",
  "Data",
  "Edge",
  "Event",
  "Secure",
  "Smart",
  "Hyper",
  "Quantum",
  "Vector",
  "Stream",
  "Atlas",
  "Beacon",
  "Cobalt",
  "Delta",
  "Ember",
  "Fusion",
  "Gravity",
  "Helix",
  "Iron",
  "Juniper",
  "Kinetic",
  "Lumen",
  "Nimbus",
  "Orbit",
];

const NOUNS = [
  "Database",
  "Gateway",
  "Queue",
  "Vault",
  "Monitor",
  "Registry",
  "Lens",
  "Pipeline",
  "Cache",
  "Search",
  "Scheduler",
  "Mesh",
  "Ledger",
  "Router",
  "Runtime",
  "Studio",
  "Tracker",
  "Warehouse",
  "Notebook",
  "Firewall",
  "Broker",
  "Function",
  "Index",
  "Backup",
];

const SUFFIXES = [
  "",
  " Pro",
  " Lite",
  " Enterprise",
  " for Kubernetes",
  " Edge",
  " Cloud",
  " Open",
  " Plus",
];

const PROVIDER_FIRST = [
  "Acme",
  "Bluewave",
  "Corvus",
  "Dynamo",
  "Evergreen",
  "Foxglove",
  "Granite",
  "Harbor",
  "Ibex",
  "Jasper",
  "Keystone",
  "Lattice",
];

const PROVIDER_LAST = ["Labs", "Systems", "Works", "Software", "Cloud"];

const TAGS = [
  "serverless",
  "open source",
  "multi-region",
  "managed",
  "compliance",
  "real-time",
  "low-code",
  "GPU",
  "encryption",
  "observability",
  "backup",
  "autoscaling",
  "SQL",
  "streaming",
  "private link",
];

const VERBS = [
  "Run",
  "Deploy",
  "Scale",
  "Protect",
  "Monitor",
  "Connect",
  "Automate",
  "Index",
  "Replicate",
  "Schedule",
];

const OBJECTS = [
  "workloads",
  "events",
  "queries",
  "secrets",
  "pipelines",
  "models",
  "containers",
  "backups",
  "endpoints",
  "datasets",
];

/** @param {number} seed */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {number} rating
 * @returns {"top" | "good" | "fair"}
 */
export function ratingBand(rating) {
  if (rating >= 4.5) return "top";
  if (rating >= 4) return "good";
  return "fair";
}

/**
 * The same `size` items on every call.
 * @param {number} [size]
 * @returns {import("./catalog-data.js").CatalogItem[]}
 */
export function generateCatalog(size = 5000) {
  const random = mulberry32(5);
  const pick = /** @param {ReadonlyArray<string>} list */ (list) =>
    list[Math.floor(random() * list.length)];
  const providers = Array.from(
    { length: PROVIDER_FIRST.length * PROVIDER_LAST.length },
    (_, i) =>
      `${PROVIDER_FIRST[i % PROVIDER_FIRST.length]} ${
        PROVIDER_LAST[Math.floor(i / PROVIDER_FIRST.length)]
      }`,
  );
  const day = 24 * 60 * 60 * 1000;
  const now = Date.UTC(2026, 10, 1);

  return Array.from({ length: size }, (_, i) => {
    const category = pick(CATEGORIES);
    const rating = Math.round((3 + random() * 2) * 10) / 10;
    const noun = NOUNS[(i * 7) % NOUNS.length];
    const prefix = PREFIXES[Math.floor(i / NOUNS.length) % PREFIXES.length];
    const suffix =
      SUFFIXES[
        Math.floor(i / (NOUNS.length * PREFIXES.length)) % SUFFIXES.length
      ];
    const tags = [pick(TAGS), pick(TAGS), pick(TAGS)].filter(
      (tag, at, all) => all.indexOf(tag) === at,
    );
    const name = `${prefix} ${noun}${suffix}`;
    return {
      id: `item-${String(i + 1).padStart(4, "0")}`,
      name,
      provider: pick(providers),
      category,
      type: pick(TYPES),
      pricing: pick(PRICING),
      rating,
      ratingBand: ratingBand(rating),
      reviews: Math.floor(random() ** 3 * 4000),
      installs: Math.floor(random() ** 2 * 90000),
      verified: random() < 0.35,
      updated: new Date(now - Math.floor(random() * 700) * day).toISOString(),
      tags,
      description: `${pick(VERBS)} ${pick(OBJECTS)} with ${name}. A ${category.toLowerCase()} offering from a ${pick(TYPES).toLowerCase()} catalog, with ${tags.join(", ")} and sensible defaults. ${pick(VERBS)} ${pick(OBJECTS)} across regions without managing the plumbing.`,
    };
  });
}

/**
 * The facets. `provider` is long on purpose: it exercises the in-facet search,
 * "Show more" and the render cap.
 */
export const FACETS = defineFacets([
  {
    id: "category",
    label: "Category",
    type: "checkbox",
    options: CATEGORIES.map((id) => ({ id })),
  },
  {
    id: "type",
    label: "Type",
    type: "checkbox",
    options: TYPES.map((id) => ({ id })),
  },
  {
    id: "pricing",
    label: "Pricing",
    type: "checkbox",
    options: PRICING.map((id) => ({ id })),
  },
  {
    id: "ratingBand",
    label: "Rating",
    type: "radio",
    options: RATING_BANDS,
  },
  {
    id: "verified",
    label: "Verified publisher",
    type: "toggle",
    toggleLabel: "Verified publishers only",
  },
  {
    id: "provider",
    label: "Provider",
    type: "checkbox",
    collapsed: true,
    options: PROVIDER_FIRST.flatMap((first) =>
      PROVIDER_LAST.map((last) => ({ id: `${first} ${last}` })),
    ),
  },
]);
