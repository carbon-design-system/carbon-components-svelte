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
import { analyzeScopes, type Binding, parse, type Scope } from "sveast";

type Node = {
  type: string;
  start: number;
  end: number;
  name?: string;
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

/**
 * A component's AST and the bindings its `<script>` declares, types as
 * well as values, so a `lang="ts"` page keeps the `import type` and
 * `type` declarations an example's code uses.
 */
function analyze(source: string) {
  const ast = parse(source, { css: false });
  const scopes = analyzeScopes(ast, { types: true });
  return {
    body: (ast.instance?.content.body ?? []) as unknown as Node[],
    instance: scopes.instance,
    bindings: [
      ...scopes.instance.declarations.values(),
      ...scopes.instance.types.values(),
    ],
  };
}

/** Whether `scope` is in a function, short of the `<script>`'s scope. */
function inFunction(scope: Scope, instance: Scope): boolean {
  for (let s: Scope | null = scope; s && s !== instance; s = s.parent) {
    if (s.node && FUNCTION_TYPES.has(s.node.type)) return true;
  }
  return false;
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

function parseStatement(
  node: Node,
  source: string,
  bindings: Binding[],
  instance: Scope,
): Statement {
  if (node.type === "ImportDeclaration") {
    const specifiers = (node.specifiers as Node[]).map((s): Specifier => ({
      kind:
        s.type === "ImportDefaultSpecifier"
          ? "default"
          : s.type === "ImportNamespaceSpecifier"
            ? "namespace"
            : "named",
      imported: (s.imported as Node | undefined)?.name ?? "",
      local: (s.local as Node).name as string,
      typeOnly: s.importKind === "type",
    }));
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

  const within = (n: { start: number }) =>
    n.start >= node.start && n.start < node.end;
  const declares = new Set<string>();
  const references = new Set<string>();
  for (const binding of bindings) {
    if (binding.node && within(binding.node)) declares.add(binding.name);
    for (const reference of binding.references) {
      if (!within(reference.node)) continue;
      references.add(binding.name);
      // `$: x = …`, `$: if (…) { x = … }`: a statement that writes page
      // state comes along with that state.
      if (reference.writes && !inFunction(reference.scope, instance)) {
        declares.add(binding.name);
      }
    }
  }
  for (const name of declares) references.delete(name);

  // Keep a leading comment (`/** … */`) with its declaration.
  const comments = node.leadingComments as Node[] | undefined;
  const start = comments?.length ? comments[0].start : node.start;
  return {
    text: dedent(source.slice(start, node.end)),
    declares: [...declares],
    references,
  };
}

const pageStatementsCache = new Map<string, Statement[]>();

function pageStatements(pageScript: string): Statement[] {
  let statements = pageStatementsCache.get(pageScript);
  if (!statements) {
    const { body, bindings, instance } = analyze(pageScript);
    statements = body.map((node) =>
      parseStatement(node, pageScript, bindings, instance),
    );
    pageStatementsCache.set(pageScript, statements);
  }
  return statements;
}

/**
 * The page-script names an example's markup uses, read from the page
 * script and the markup as one component: tags, directives, `{…}`
 * expressions and `$store` subscriptions, but not names the markup
 * declares itself, such as an `{#each}` item or a `let:` directive.
 */
function markupReferences(markup: string, pageScript: string): Set<string> {
  const markupStart = pageScript.length + 1;
  const references = new Set<string>();
  for (const binding of analyze(`${pageScript}\n${markup}`).bindings) {
    if (binding.references.some((r) => r.node.start >= markupStart)) {
      references.add(binding.name);
    }
  }
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
  const queue = [...markupReferences(markup, pageScript)];
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
