// @reads src/**/*.svelte src/Kbd/kbd-keys.js i18n/strings.json
/**
 * Writes the English string table, the translators' manifest:
 * `i18n/strings.json`. It lists every `*Text` and `*Description` prop and
 * every `translateWithId` id, with the component, the prop, its type and
 * the English default.
 *
 *   bun run build:docs   # writes docs/src/COMPONENT_API.json, the input
 *   bun run build:strings
 *
 * `tests/scripts/strings.test.ts` fails when the committed file differs
 * from this script's output. Rerun the script after adding or changing a
 * string.
 *
 * The file sits outside `src/` and `docs/`: `src/` is the published
 * package, which ships only `.svelte`, `.js` and `.d.ts` files, and the
 * table is for people who translate the library, not for its users' bundles.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
export const API_PATH = join(ROOT, "docs/src/COMPONENT_API.json");
export const STRINGS_PATH = join(ROOT, "i18n/strings.json");

type ApiProp = {
  name: string;
  kind: string;
  type?: string;
  value?: string;
  defaultValue?: { raw: string; kind: string; value?: unknown };
};

type ApiComponent = {
  moduleName: string;
  filePath: string;
  props: ApiProp[];
};

/** How to read a `default`. */
export type DefaultKind =
  /** The English text. */
  | "text"
  /** The source of the function that builds the English text. */
  | "function"
  /** A description of the default, from the prop's `@default` tag. */
  | "described"
  /** No default: the prop is unset. */
  | "none";

export type TextEntry = {
  component: string;
  prop: string;
  type: string;
  default: string | null;
  defaultKind: DefaultKind;
};

export type TranslateWithIdEntry = {
  component: string;
  prop: string;
  type: string;
  /** English text by translation id. */
  ids: Record<string, string>;
};

export type Strings = {
  generatedBy: string;
  /** Every `*Text` and `*Description` prop. */
  text: TextEntry[];
  /** Every prop that takes a `translateWithId` function. */
  translateWithId: TranslateWithIdEntry[];
  /**
   * Every translation id with its English text. `setTranslateContext`
   * receives these ids from all components, so one id has one meaning.
   */
  ids: Record<string, string>;
};

const TRANSLATE_PROP = /translateWithId/i;
const IMPORTED_COMPONENT = /import\("[^"]*?(\w+)\.svelte"\)/;
const ID_PARAMETER = /\(id: ([^)]*)\)/;
const QUOTED_ID = /"(\w+)"/g;

const isTextProp = (prop: ApiProp) =>
  prop.kind === "let" &&
  (prop.name.endsWith("Text") || prop.name.endsWith("Description"));

const isTranslateProp = (prop: ApiProp) =>
  prop.kind === "let" && TRANSLATE_PROP.test(prop.name);

function describeDefault(
  prop: ApiProp,
): Pick<TextEntry, "default" | "defaultKind"> {
  const def = prop.defaultValue;
  if (!def) return { default: null, defaultKind: "none" };
  if (def.kind === "function") {
    return { default: prop.value ?? def.raw, defaultKind: "function" };
  }
  if (def.kind === "literal") {
    return { default: String(def.value), defaultKind: "text" };
  }
  if (def.raw === "undefined" && (prop.value ?? "undefined") === "undefined") {
    return { default: null, defaultKind: "none" };
  }
  return { default: prop.value ?? def.raw, defaultKind: "described" };
}

/** The English text by id from a `const defaultTranslations = { ... }` block. */
function readDefaultTranslations(source: string): Record<string, string> {
  const start = source.indexOf("const defaultTranslations = {");
  if (start === -1) return {};
  const end = source.indexOf("\n  };", start);
  const block = source.slice(start, end);
  const out: Record<string, string> = {};
  for (const match of block.matchAll(
    /\[translationIds\.(\w+)\]:\s*("(?:[^"\\]|\\.)*")/g,
  )) {
    out[match[1]] = JSON.parse(match[2]);
  }
  return out;
}

/** The English key names `Kbd` shows, from `src/Kbd/kbd-keys.js`. */
function readKbdTranslations(source: string): Record<string, string> {
  const start = source.indexOf("export const KBD_TRANSLATIONS = {");
  const end = source.indexOf("\n};", start);
  const out: Record<string, string> = {};
  for (const match of source
    .slice(start, end)
    .matchAll(/^\s+(\w+):\s*("(?:[^"\\]|\\.)*"),/gm)) {
    out[match[1]] = JSON.parse(match[2]);
  }
  return out;
}

/**
 * Builds the table from sveld's API file. `read` returns the text of a file
 * under the repository root.
 */
export function buildStrings(
  api: { components: ApiComponent[] },
  read: (path: string) => string,
): Strings {
  const components = [...api.components].sort((a, b) =>
    a.moduleName.localeCompare(b.moduleName, "en"),
  );
  const byName = new Map(components.map((c) => [c.moduleName, c]));

  // Ids a component defines itself (`translationIds` and its English text).
  const own = new Map<string, Record<string, string>>();
  for (const component of components) {
    const idsProp = component.props.find((p) => p.name === "translationIds");
    if (!idsProp) continue;
    const source = read(component.filePath);
    const english =
      component.moduleName === "Kbd"
        ? readKbdTranslations(read("src/Kbd/kbd-keys.js"))
        : readDefaultTranslations(source);
    const ids = Object.keys(
      (idsProp.defaultValue?.value as Record<string, string>) ?? {},
    );
    const table: Record<string, string> = {};
    for (const id of ids) {
      if (english[id] === undefined) {
        throw new Error(`${component.moduleName}: no English text for "${id}"`);
      }
      table[id] = english[id];
    }
    own.set(component.moduleName, table);
  }

  const ids: Record<string, string> = {};
  for (const table of own.values()) {
    for (const [id, text] of Object.entries(table)) {
      if (ids[id] !== undefined && ids[id] !== text) {
        throw new Error(
          `The id "${id}" has two English texts ("${ids[id]}" and "${text}"). ` +
            "setTranslateContext sees ids from all components, so rename one.",
        );
      }
      ids[id] = text;
    }
  }

  const text: TextEntry[] = [];
  const translateWithId: TranslateWithIdEntry[] = [];

  for (const component of components) {
    const props = [...component.props].sort((a, b) =>
      a.name.localeCompare(b.name, "en"),
    );
    for (const prop of props) {
      if (isTextProp(prop)) {
        text.push({
          component: component.moduleName,
          prop: prop.name,
          type: prop.type ?? "string",
          ...describeDefault(prop),
        });
      }
      if (isTranslateProp(prop)) {
        const type = prop.type ?? "";
        const imported = IMPORTED_COMPONENT.exec(type)?.[1];
        const literals = [
          ...(ID_PARAMETER.exec(type)?.[1] ?? "").matchAll(QUOTED_ID),
        ].map((m) => m[1]);
        const source =
          imported && byName.has(imported) ? imported : component.moduleName;
        const table = own.get(source) ?? {};
        const wanted = literals.length > 0 ? literals : Object.keys(table);
        const entry: Record<string, string> = {};
        for (const id of wanted) {
          const english = ids[id];
          if (english === undefined) {
            throw new Error(
              `${component.moduleName}.${prop.name}: unknown id "${id}"`,
            );
          }
          entry[id] = english;
        }
        if (Object.keys(entry).length === 0) {
          throw new Error(
            `${component.moduleName}.${prop.name}: found no translation ids`,
          );
        }
        translateWithId.push({
          component: component.moduleName,
          prop: prop.name,
          type,
          ids: entry,
        });
      }
    }
  }

  const sortedIds = Object.fromEntries(
    Object.entries(ids).sort(([a], [b]) => a.localeCompare(b, "en")),
  );

  return {
    generatedBy: "scripts/generate-strings.ts (bun run build:strings)",
    text,
    translateWithId,
    ids: sortedIds,
  };
}

export function renderStrings(strings: Strings): string {
  return `${JSON.stringify(strings, null, 2)}\n`;
}

/** Reads `docs/src/COMPONENT_API.json` and builds the table from it. */
export function generateStrings(): string {
  if (!existsSync(API_PATH)) {
    throw new Error(
      "docs/src/COMPONENT_API.json is missing. Run `bun run build:docs` first.",
    );
  }
  const api = JSON.parse(readFileSync(API_PATH, "utf-8"));
  return renderStrings(
    buildStrings(api, (path) => readFileSync(join(ROOT, path), "utf-8")),
  );
}

if (import.meta.main) {
  writeFileSync(STRINGS_PATH, generateStrings());
  console.log(`[generate-strings] wrote ${STRINGS_PATH}`);
}
