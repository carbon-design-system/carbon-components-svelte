// A pretend data catalog for the AddSelect examples: 10 domains, each with 9
// schemas, each with 110 datasets, which is 10,000 items in all. Built with no
// randomness so a test can name the same item every run.
import type {
  AddSelectItem,
  AddSelectPage,
  AddSelectRequest,
} from "carbon-components-svelte/AddSelect/AddSelect.svelte";

export type CatalogItem = AddSelectItem;

const WHITESPACE = /\s+/;

const DOMAINS = [
  "Finance",
  "Marketing",
  "Operations",
  "People",
  "Research",
  "Sales",
  "Security",
  "Support",
  "Supply chain",
  "Platform",
];
const SCHEMAS = [
  "Raw",
  "Staging",
  "Curated",
  "Reporting",
  "Archive",
  "Sandbox",
  "Forecast",
  "Audit",
  "Shared",
];
const NOUNS = [
  "orders",
  "invoices",
  "accounts",
  "events",
  "sessions",
  "tickets",
  "shipments",
  "payments",
  "contacts",
  "campaigns",
  "metrics",
];
const MODIFIERS = [
  "Daily",
  "Weekly",
  "Monthly",
  "Regional",
  "Global",
  "Historical",
  "Anonymized",
  "Enriched",
  "Deduplicated",
  "Partitioned",
];
const TYPES = ["table", "view", "stream", "file"];
const OWNERS = ["data-eng", "analytics", "finance-ops", "growth", "platform"];
const TYPE_LABELS: Record<string, string> = {
  table: "Table",
  view: "View",
  stream: "Stream",
  file: "File",
};

export const CATALOG_TOTAL = 10_000;

export const catalogFilters = [
  {
    id: "type",
    labelText: "Type",
    options: TYPES.map((id) => ({ id, labelText: TYPE_LABELS[id] })),
  },
  {
    id: "owner",
    labelText: "Owner",
    options: OWNERS.map((id) => ({ id, labelText: id })),
  },
];

let cached: CatalogItem[] | undefined;

/** The whole catalog, built once. */
export function buildCatalog(): CatalogItem[] {
  if (cached) return cached;
  const items: CatalogItem[] = [];
  DOMAINS.forEach((domain, d) => {
    items.push({
      id: `d${d}`,
      title: domain,
      description: `${SCHEMAS.length} schemas`,
      hasChildren: true,
      childCount: SCHEMAS.length,
    });
    SCHEMAS.forEach((schema, s) => {
      items.push({
        id: `s${d}-${s}`,
        title: schema,
        parentId: `d${d}`,
        description: `${domain} ${schema.toLowerCase()} datasets`,
        hasChildren: true,
        childCount: NOUNS.length * MODIFIERS.length,
      });
      let n = 0;
      for (const noun of NOUNS) {
        for (const modifier of MODIFIERS) {
          const type = TYPES[(d + s + n) % TYPES.length];
          const rows = ((d + 3) * (s + 5) * (n + 7) * 137) % 9_000_000;
          items.push({
            id: `t${d}-${s}-${n}`,
            title: `${modifier} ${noun}`,
            parentId: `s${d}-${s}`,
            description: `${modifier} ${noun} for ${domain.toLowerCase()}`,
            meta: [TYPE_LABELS[type], `${rows.toLocaleString("en-US")} rows`],
            attributes: { type, owner: OWNERS[(d * 3 + n) % OWNERS.length] },
            disabled: n % 37 === 36,
          });
          n++;
        }
      }
    });
  });
  cached = items;
  return items;
}

export type CatalogSourceOptions = {
  /** Milliseconds a request takes. */
  latency?: number;
  pageSize?: number;
  /** Fail every request whose query contains this text. */
  failOn?: string;
};

/**
 * Answers an AddSelect request after `latency`, as a server would: it honors
 * the abort signal, and it pages with an offset cursor.
 */
export function createCatalogSource(
  items: CatalogItem[],
  { latency = 250, pageSize = 40, failOn }: CatalogSourceOptions = {},
) {
  const children = new Map<string | number | null, CatalogItem[]>();
  const byId = new Map<string | number, CatalogItem>();
  for (const item of items) {
    byId.set(item.id, item);
    const parent = item.parentId ?? null;
    const siblings = children.get(parent);
    if (siblings) siblings.push(item);
    else children.set(parent, [item]);
  }
  const pathOf = (item: CatalogItem) => {
    const path: { id: string | number; title: string }[] = [];
    let parent = item.parentId;
    while (parent != null) {
      const node = byId.get(parent);
      if (!node) break;
      path.unshift({ id: node.id, title: node.title });
      parent = node.parentId;
    }
    return path;
  };

  return (
    request: AddSelectRequest,
    { signal, cursor }: { signal: AbortSignal; cursor?: number | null },
  ) =>
    new Promise<AddSelectPage>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (failOn && request.query.includes(failOn)) {
          reject(new Error("The catalog is unavailable."));
          return;
        }
        const words = request.query
          .toLowerCase()
          .split(WHITESPACE)
          .filter(Boolean);
        const pool =
          request.scope === "all"
            ? items
            : (children.get(request.parentId ?? null) ?? []);
        const filters = Object.entries(request.filters);
        const matched = pool.filter((item) => {
          const text = `${item.title} ${item.description ?? ""}`.toLowerCase();
          if (!words.every((word) => text.includes(word))) return false;
          if (filters.length === 0) return true;
          if (item.hasChildren) return request.scope === "level";
          return filters.every(([id, chosen]) => {
            const has = item.attributes?.[id];
            return (
              chosen.length === 0 ||
              (typeof has === "string" && chosen.includes(has))
            );
          });
        });
        const start = cursor ?? 0;
        const page = matched.slice(start, start + pageSize);
        resolve({
          items:
            request.scope === "all"
              ? page.map((item) => ({ ...item, path: pathOf(item) }))
              : page,
          nextCursor:
            start + pageSize < matched.length ? start + pageSize : null,
          total: matched.length,
        });
      }, latency);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
}
