import pkg from "../../package.json" with { type: "json" };
import COMPONENT_API from "./COMPONENT_API.json";
import COMPONENT_META from "./COMPONENT_META.json";
import {
  CATEGORY_BY_COMPONENT,
  COMPONENT_CATEGORIES,
} from "./component-categories";
import { COMPONENT_SINCE_VERSIONS } from "./component-since-versions";

export const CATEGORY_FILTER_PARAM = "categories";

export const SEARCH_FILTER_PARAM = "q";

export function versionRank(version?: string): number {
  if (!version) return -1;
  return version
    .split(".")
    .reduce((rank, part) => rank * 1000 + (Number.parseInt(part, 10) || 0), 0);
}

const PUBLISHED_VERSION_RANK = versionRank(pkg.version);

export function isNewComponent(name: string): boolean {
  const since = COMPONENT_SINCE_VERSIONS[name];
  return since !== undefined && versionRank(since) > PUBLISHED_VERSION_RANK;
}

export interface ComponentIndexEntry {
  name: string;
  category: string;
  href: string;
  sourcePath: string;
  markdownHref: string;
  sinceVersion?: string;
  isNew: boolean;
  props: number;
  events: number;
  slots: number;
  apiSurface: number;
}

export type SortKey =
  | "name"
  | "category"
  | "props"
  | "events"
  | "slots"
  | "since";
export type SortDirection = "asc" | "desc";

const VALID_CATEGORY_LABELS = new Set(
  COMPONENT_CATEGORIES.map((category) => category.label),
);

const META = COMPONENT_META as Record<
  string,
  { props: number; events: number; slots: number }
>;

const FILE_PATH_BY_MODULE = new Map(
  COMPONENT_API.components.map((component) => [
    component.moduleName,
    component.filePath,
  ]),
);

export function sourcePathFor(name: string): string {
  return FILE_PATH_BY_MODULE.get(name) ?? `src/${name}/${name}.svelte`;
}

export function buildComponentIndex(): ComponentIndexEntry[] {
  return Object.keys(CATEGORY_BY_COMPONENT).map((name) => {
    const counts = META[name] ?? { props: 0, events: 0, slots: 0 };
    return {
      name,
      category: CATEGORY_BY_COMPONENT[name],
      href: `/components/${name}`,
      sourcePath: sourcePathFor(name),
      markdownHref: `/components/${name}.md`,
      sinceVersion: COMPONENT_SINCE_VERSIONS[name],
      isNew: isNewComponent(name),
      props: counts.props,
      events: counts.events,
      slots: counts.slots,
      apiSurface: counts.props + counts.events + counts.slots,
    };
  });
}

export function parseCategoryFilterParam(param: string | null): string[] {
  if (!param?.trim()) return [];
  const labels = param
    .split(",")
    .map((label) => decodeURIComponent(label.trim()))
    .filter((label) => VALID_CATEGORY_LABELS.has(label));
  return [...new Set(labels)];
}

export function serializeCategoryFilterParam(labels: string[]): string {
  const valid = labels.filter((label) => VALID_CATEGORY_LABELS.has(label));
  if (valid.length === 0) return "";
  return valid.map(encodeURIComponent).join(",");
}

export function categoryFilterHref(labels: string[]): string {
  const serialized = serializeCategoryFilterParam(labels);
  return serialized
    ? `/component-index?${CATEGORY_FILTER_PARAM}=${serialized}`
    : "/component-index";
}

export function filterComponents(
  entries: ComponentIndexEntry[],
  query: string,
): ComponentIndexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q),
  );
}

export function sortComponents(
  entries: ComponentIndexEntry[],
  key: SortKey,
  direction: SortDirection,
): ComponentIndexEntry[] {
  const sign = direction === "asc" ? 1 : -1;
  const byName = (a: ComponentIndexEntry, b: ComponentIndexEntry) =>
    a.name.localeCompare(b.name);

  return [...entries].sort((a, b) => {
    let primary = 0;
    switch (key) {
      case "name":
        primary = byName(a, b);
        break;
      case "category":
        primary = a.category.localeCompare(b.category) || byName(a, b);
        break;
      case "since":
        primary = versionRank(a.sinceVersion) - versionRank(b.sinceVersion);
        break;
      case "props":
        primary = a.props - b.props;
        break;
      case "events":
        primary = a.events - b.events;
        break;
      case "slots":
        primary = a.slots - b.slots;
        break;
    }
    if (primary === 0 && key !== "name") return byName(a, b);
    return sign * primary;
  });
}
