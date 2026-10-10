/**
 * The standalone source of an inline example: its markup, plus exactly the
 * imports and declarations from the page's `<script>` that it uses,
 * followed to whatever those declarations use in turn.
 *
 * An inline example compiles inside its page, so every name it uses is
 * declared in the page script (or is a global). Reading the page's real
 * imports, rather than guessing which capitalized names are icons, gives
 * the code view what a reader needs to copy and run it.
 */
import { walk } from "estree-walker";
import { parse } from "svelte/compiler";

type Node = {
  type: string;
  start: number;
  end: number;
  name?: string;
  computed?: boolean;
  [key: string]: unknown;
};

type Specifier = {
  kind: "default" | "named" | "namespace";
  imported: string;
  local: string;
  typeOnly: boolean;
};

type Statement = {
  text: string;
  /** Names the statement declares, or (for `$:` and bare statements) assigns. */
  declares: string[];
  references: Set<string>;
  /** For an import: its specifiers, so unused ones can be dropped. */
  imports?: { source: string; typeOnly: boolean; specifiers: Specifier[] };
};

const INSTANCE_SCRIPT_RE = /^<script\b(?![^>]*\bcontext=)[^>]*>/;
const LEADING_INDENT_RE = /^[ \t]*/;
const LINE_START_RE = /^/gm;
const LANG_TS_RE = /\blang=["']ts["']/;

const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
]);

/** Whether an `Identifier` refers to a binding, rather than naming a property, key, or label. */
function isReference(parent: Node | null, key: PropertyKey | null | undefined) {
  if (!parent) return true;
  switch (parent.type) {
    case "MemberExpression":
      return parent.computed || key === "object";
    case "Property":
    case "MethodDefinition":
    case "PropertyDefinition":
      return parent.computed || key === "value";
    case "LabeledStatement":
    case "BreakStatement":
    case "ContinueStatement":
    case "ImportSpecifier":
    case "ExportSpecifier":
    case "MetaProperty":
      return false;
    default:
      return !(FUNCTION_TYPES.has(parent.type) && key === "params");
  }
}

/**
 * Names a template node binds for its children: `{#each items as item, i}`,
 * `{:then value}`, `let:x`, `{#snippet s(a)}`, and `{@const x = …}` among
 * its children.
 */
function templateBindings(node: Node): string[] {
  const names: string[] = [];
  const add = (pattern: unknown) => {
    if (pattern && typeof pattern === "object")
      patternNames(pattern as Node, names);
  };
  switch (node.type) {
    case "EachBlock":
      add(node.context);
      if (typeof node.index === "string") names.push(node.index);
      break;
    case "AwaitBlock":
      add(node.value);
      add(node.error);
      break;
    case "SnippetBlock":
      for (const parameter of (node.parameters as unknown[]) ?? [])
        add(parameter);
      break;
  }
  for (const attribute of (node.attributes as Node[] | undefined) ?? []) {
    if (attribute.type !== "Let") continue;
    if (attribute.expression) add(attribute.expression);
    else names.push(attribute.name as string);
  }
  for (const child of (node.children as Node[] | undefined) ?? []) {
    if (child.type !== "ConstTag") continue;
    const declaration = child.declaration as Node | undefined;
    for (const d of (declaration?.declarations as Node[] | undefined) ?? [])
      add(d.id);
    add((child.expression as Node | undefined)?.left);
  }
  return names;
}

/** Identifiers a script or template subtree refers to, minus template-local names. */
function referencesOf(root: unknown) {
  const references = new Set<string>();
  const scopes: Set<string>[] = [];
  const scoped = new Set<unknown>();
  walk(root as Parameters<typeof walk>[0], {
    enter(node, parent, key) {
      const n = node as unknown as Node;
      const bindings = templateBindings(n);
      if (bindings.length > 0) {
        scopes.push(new Set(bindings));
        scoped.add(node);
      }
      if (
        n.type === "Identifier" &&
        n.name &&
        isReference(parent as unknown as Node | null, key) &&
        !scopes.some((scope) => scope.has(n.name as string))
      ) {
        references.add(n.name);
      }
    },
    leave(node) {
      if (scoped.delete(node)) scopes.pop();
    },
  });
  return references;
}

/** Names bound by a declaration pattern, including destructuring. */
function patternNames(pattern: Node, names: string[] = []): string[] {
  switch (pattern.type) {
    case "Identifier":
      names.push(pattern.name as string);
      break;
    case "ObjectPattern":
      for (const p of pattern.properties as Node[]) {
        patternNames(
          p.type === "RestElement" ? (p.argument as Node) : (p.value as Node),
          names,
        );
      }
      break;
    case "ArrayPattern":
      for (const el of pattern.elements as (Node | null)[]) {
        if (el) patternNames(el, names);
      }
      break;
    case "RestElement":
      patternNames(pattern.argument as Node, names);
      break;
    case "AssignmentPattern":
      patternNames(pattern.left as Node, names);
      break;
  }
  return names;
}

/** Top-level names a statement assigns, e.g. `headings` in `$: if (a) headings = …`. */
function assignedNames(node: Node): string[] {
  const names: string[] = [];
  walk(node as unknown as Parameters<typeof walk>[0], {
    enter(child) {
      const n = child as unknown as Node;
      if (FUNCTION_TYPES.has(n.type)) return this.skip();
      if (n.type === "AssignmentExpression") {
        patternNames(n.left as Node, names);
      } else if (n.type === "UpdateExpression") {
        patternNames(n.argument as Node, names);
      }
    },
  });
  return names;
}

function dedent(text: string): string {
  const lines = text.split("\n");
  const indents = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => LEADING_INDENT_RE.exec(line)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((line, i) =>
      i === 0
        ? line
        : line.slice(
            Math.min(min, LEADING_INDENT_RE.exec(line)?.[0].length ?? 0),
          ),
    )
    .join("\n");
}

function parseStatement(node: Node, source: string): Statement {
  if (node.type === "ImportDeclaration") {
    const specifiers = (node.specifiers as Node[]).map(
      (s): Specifier => ({
        kind:
          s.type === "ImportDefaultSpecifier"
            ? "default"
            : s.type === "ImportNamespaceSpecifier"
              ? "namespace"
              : "named",
        imported: (s.imported as Node | undefined)?.name ?? "",
        local: (s.local as Node).name as string,
        typeOnly: s.importKind === "type",
      }),
    );
    return {
      text: source.slice(node.start, node.end),
      declares: specifiers.map((s) => s.local),
      references: new Set(),
      imports: {
        source: (node.source as Node).raw as string,
        typeOnly: node.importKind === "type",
        specifiers,
      },
    };
  }

  const declaration =
    node.type === "ExportNamedDeclaration" && node.declaration
      ? (node.declaration as Node)
      : node;
  let declares: string[];
  switch (declaration.type) {
    case "VariableDeclaration":
      declares = (declaration.declarations as Node[]).flatMap((d) =>
        patternNames(d.id as Node),
      );
      break;
    case "FunctionDeclaration":
    case "ClassDeclaration":
    case "TSInterfaceDeclaration":
    case "TSTypeAliasDeclaration":
      declares = [(declaration.id as Node).name as string];
      break;
    default:
      // `$: x = …`, `$: if (…) { x = … }`, `onMount(() => …)`: a statement
      // that writes page state comes along with that state.
      declares = assignedNames(declaration);
  }

  // Keep a leading comment (`/** … */`) with its declaration.
  const comments = node.leadingComments as Node[] | undefined;
  const start = comments?.length ? comments[0].start : node.start;
  const references = referencesOf(node);
  for (const name of declares) references.delete(name);
  references.delete("$");
  return { text: dedent(source.slice(start, node.end)), declares, references };
}

const pageStatementsCache = new Map<string, Statement[]>();

function pageStatements(pageScript: string): Statement[] {
  let statements = pageStatementsCache.get(pageScript);
  if (!statements) {
    const program = parse(pageScript).instance?.content as unknown as
      | { body: Node[] }
      | undefined;
    statements = (program?.body ?? []).map((node) =>
      parseStatement(node, pageScript),
    );
    pageStatementsCache.set(pageScript, statements);
  }
  return statements;
}

/**
 * Names an example's markup uses: component tags, `use:`/`transition:`/
 * `in:`/`out:`/`animate:` directives, and every `{…}` expression, including
 * shorthand `bind:x` and `class:x`.
 */
function markupReferences(markup: string): Set<string> {
  const html = parse(markup).html;
  const references = referencesOf(html);
  walk(html as unknown as Parameters<typeof walk>[0], {
    enter(node) {
      const n = node as unknown as Node;
      if (
        n.type === "InlineComponent" ||
        n.type === "Action" ||
        n.type === "Transition" ||
        n.type === "Animation"
      ) {
        const name = (n.name as string).split(".")[0];
        if (!name.startsWith("svelte:")) references.add(name);
      }
    },
  });
  return references;
}

/** The `<script>` (not `context="module"`) among a page's top-level HTML blocks. */
export function isInstanceScript(html: string): boolean {
  return INSTANCE_SCRIPT_RE.test(html);
}

/**
 * The example's standalone source: a `<script>` with the page-script
 * imports and declarations it needs (unused import specifiers dropped),
 * then the markup. Without a page script, or when the example needs none
 * of it, the markup alone.
 */
export function exampleSource(
  markup: string,
  pageScript: string | undefined,
): string {
  if (!pageScript) return markup;
  const statements = pageStatements(pageScript);
  const byName = new Map<string, Statement[]>();
  for (const statement of statements) {
    for (const name of statement.declares) {
      const list = byName.get(name);
      if (list) list.push(statement);
      else byName.set(name, [statement]);
    }
  }

  // Everything the markup uses, then what those statements use, to a fixpoint.
  const needed = new Set<string>();
  const included = new Set<Statement>();
  const queue = [...markupReferences(markup)];
  while (queue.length > 0) {
    const name = queue.pop() as string;
    if (needed.has(name) || !byName.has(name)) continue;
    needed.add(name);
    for (const statement of byName.get(name) ?? []) {
      if (included.has(statement)) continue;
      included.add(statement);
      if (!statement.imports) queue.push(...statement.declares);
      queue.push(...statement.references);
    }
  }
  if (included.size === 0) return markup;

  const lines: string[] = [];
  let afterImports = false;
  for (const statement of statements) {
    if (!included.has(statement)) continue;
    const imports = statement.imports;
    if (!imports) {
      // A blank line between the imports and the declarations.
      if (!afterImports && lines.length > 0) lines.push("");
      afterImports = true;
      lines.push(statement.text);
      continue;
    }
    const used = imports.specifiers.filter((s) => needed.has(s.local));
    const named = used.filter((s) => s.kind === "named");
    const parts = [
      ...used.filter((s) => s.kind === "default").map((s) => s.local),
      ...used
        .filter((s) => s.kind === "namespace")
        .map((s) => `* as ${s.local}`),
      ...(named.length > 0
        ? [
            `{ ${named
              .map(
                (s) =>
                  (s.typeOnly ? "type " : "") +
                  (s.imported === s.local
                    ? s.local
                    : `${s.imported} as ${s.local}`),
              )
              .join(", ")} }`,
          ]
        : []),
    ];
    lines.push(
      `import ${imports.typeOnly ? "type " : ""}${parts.join(", ")} from ${imports.source};`,
    );
  }

  const lang = LANG_TS_RE.test(pageScript) ? ' lang="ts"' : "";
  const body = lines
    .map((line) => (line ? line.replace(LINE_START_RE, "  ") : line))
    .join("\n");
  return `<script${lang}>\n${body}\n</script>\n\n${markup}`;
}
