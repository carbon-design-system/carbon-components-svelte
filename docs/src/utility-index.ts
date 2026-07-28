import COMPONENT_API from "./COMPONENT_API.json";
import { sourceRepoUrl } from "./component-index";

/** One exported utility (function, const, type) surfaced by sveld's `documentExports`. */
export interface UtilityIndexEntry {
  name: string;
  nameLower: string;
  /** Declaration kind: "function", "const", "type", etc. */
  kind: string;
  /** Signature/type text from the source (e.g. `(text, query, options = {})`). */
  signature?: string;
  description?: string;
  descriptionLower: string;
  /** Repo-relative source path (e.g. `src/utils/fuzzyMatch.js`). */
  sourcePath: string;
  isTypeOnly: boolean;
}

interface RawEntryExport {
  name: string;
  kind: string;
  type?: string;
  value?: string;
  description?: string;
  source?: string;
  isTypeOnly: boolean;
}

// Components re-exported through the entry barrel (e.g. `ContainedList`) are
// surfaced as plain `const` exports by sveld since the re-export hops through an
// `index.js`. They already live in the component index, so exclude them here.
const COMPONENT_NAMES = new Set(
  COMPONENT_API.components.map((component) => component.moduleName),
);

const RAW_EXPORTS: RawEntryExport[] =
  (COMPONENT_API as { exports?: RawEntryExport[] }).exports ?? [];

const LEADING_DOT_SLASH = /^\.\//;

/** Resolve a source path relative to the entry barrel into a repo-relative path. */
function resolveSourcePath(source?: string): string {
  if (!source) return "";
  return `src/${source.replace(LEADING_DOT_SLASH, "")}`;
}

export function utilitySourceRepoUrl(sourcePath: string): string {
  return sourceRepoUrl(sourcePath);
}

export function buildUtilityIndex(): UtilityIndexEntry[] {
  return RAW_EXPORTS.filter((entry) => !COMPONENT_NAMES.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      nameLower: entry.name.toLowerCase(),
      kind: entry.kind,
      signature: entry.type,
      description: entry.description,
      descriptionLower: (entry.description ?? "").toLowerCase(),
      sourcePath: resolveSourcePath(entry.source),
      isTypeOnly: entry.isTypeOnly,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterUtilities(
  entries: UtilityIndexEntry[],
  query: string,
): UtilityIndexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.nameLower.includes(q) || entry.descriptionLower.includes(q),
  );
}
