import { parse } from "sveast";
import { analyzeScopes } from "sveast/scope";
import { Output } from "./output";

/**
 * Turns a component into TypeScript (or JS with JSDoc, for a component
 * without `lang="ts"`) that a type checker can read, the way svelte2tsx
 * does: the instance script becomes a `$$render` function, the markup an
 * `async () => {}` inside it, and the component the default export. The
 * `__sveltets_2_*` helpers it calls are declared in `shims.d.ts`, and
 * `svelteHTML` in svelte's `svelte-html.d.ts`.
 */
const GENERIC_PARAM =
  /^(\w+)(?:\s+extends\s+([\s\S]+?))?(?:\s*=\s*([\s\S]+))?$/;
const TS_LANG = /^(ts|typescript)$/;
const OWNS_TEMPLATE = /@(typedef|callback)\b/;
const JSDOC_BLOCK = /\/\*\*[\s\S]*?\*\//g;
const JSDOC_LINE_START = /^\s*\/?\*+\s?/;
const JSDOC_END = /\s*\*\/\s*$/;
const USES_ALL_PROPS = /\$\$(restProps|props)\b/;

/** Attributes svelte2tsx passes as numbers when their text is numeric. */
const NUMBER_ATTRIBUTES = new Set(
  "aria-colcount aria-colindex aria-colspan aria-level aria-posinset aria-rowcount aria-rowindex aria-rowspan aria-setsize aria-valuemax aria-valuemin aria-valuenow results span marginheight marginwidth maxlength minlength currenttime defaultplaybackrate volume high low optimum start size border cols rows colspan rowspan tabindex".split(
    " ",
  ),
);

export type EmitOptions = {
  /** A new specifier for an import that leaves the workspace, if any. */
  rewriteImport?: (specifier: string) => string | undefined;
};

/** `generics="T extends A = B, U"` as JSDoc: `@template {A} [T=B]`, `@template U`. */
function jsdocTemplates(generics: string) {
  const params: string[] = [];
  let depth = 0;
  let current = "";
  for (const c of generics) {
    if ("<([{".includes(c)) depth++;
    if (">)]}".includes(c)) depth--;
    if (c === "," && depth === 0) {
      params.push(current);
      current = "";
    } else current += c;
  }
  params.push(current);
  return params
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(GENERIC_PARAM);
      if (!m) return ` * @template ${p}`;
      const [, name, constraint, fallback] = m;
      return ` * @template ${constraint ? `{${constraint}} ` : ""}${fallback ? `[${name}=${fallback}]` : name}`;
    });
}

export function emit(source: string, { rewriteImport }: EmitOptions = {}) {
  // biome-ignore lint/suspicious/noExplicitAny: sveast's AST is untyped here
  type Node = any;
  const ast: Node = parse(source, { css: false });
  const scopes: Node = analyzeScopes(ast);
  const out = new Output(source);
  const instance = ast.instance;
  const module = ast.module;
  const isTs = [instance, module].some((script) =>
    script?.attributes?.some(
      (a: Node) => a.name === "lang" && TS_LANG.test(textOf(a)),
    ),
  );
  let uid = 0;
  const slots = new Set<string>();

  function textOf(attribute: Node) {
    const value = Array.isArray(attribute.value)
      ? attribute.value[0]
      : attribute.value;
    return value?.data ?? "";
  }

  const idsOf = (pattern: Node, ids: string[] = []): string[] => {
    if (!pattern) return ids;
    if (pattern.type === "Identifier") ids.push(pattern.name);
    else if (pattern.type === "ObjectPattern")
      for (const p of pattern.properties)
        idsOf(p.type === "RestElement" ? p.argument : p.value, ids);
    else if (pattern.type === "ArrayPattern")
      for (const e of pattern.elements) idsOf(e, ids);
    else if (pattern.type === "AssignmentPattern") idsOf(pattern.left, ids);
    else if (pattern.type === "RestElement") idsOf(pattern.argument, ids);
    return ids;
  };

  // --- Module script and the instance script's imports, at the top level.
  /** Copies a statement, pointing an import that leaves the workspace at its target. */
  const copyStatement = (s: Node) => {
    const spec = s.source?.value;
    const next = typeof spec === "string" ? rewriteImport?.(spec) : undefined;
    if (next === undefined) return out.copy(s.start, s.end);
    out.copy(s.start, s.source.start);
    out.from(s.source.start, () => out.raw(JSON.stringify(next)));
    return out.copy(s.source.end, s.end);
  };
  if (module) {
    let at = module.content.start;
    for (const s of module.content.body) {
      out.copy(at, s.start);
      copyStatement(s);
      at = s.end;
    }
    out.copy(at, module.content.end).raw("\n");
  }
  const body: Node[] = instance?.content.body ?? [];
  for (const s of body)
    if (s.type === "ImportDeclaration") copyStatement(s).raw("\n");

  // --- Generics: `generics="…"` in TS, `@template` blocks in JS. TS 7 reads
  // only the JSDoc block right above a function, so merge the tags into one.
  /** JSDoc blocks moved out of the instance script. */
  const templateBlocks: [number, number][] = [];
  let generics = "";
  if (instance) {
    const tags: string[] = [];
    const attr = instance.attributes.find((a: Node) => a.name === "generics");
    if (attr && isTs) generics = `<${textOf(attr)}>`;
    else if (attr) tags.push(...jsdocTemplates(textOf(attr)));
    const text = source.slice(instance.content.start, instance.content.end);
    for (const m of text.matchAll(JSDOC_BLOCK)) {
      const start = instance.content.start + (m.index ?? 0);
      // A `@typedef` or `@callback` (which owns its `@template`) moves to the
      // top level, where TS 7 lets the component's `@template` see it.
      if (OWNS_TEMPLATE.test(m[0])) {
        templateBlocks.push([start, start + m[0].length]);
        // The `;` keeps its other tags (sveld's `@type` for an event) off
        // the next declaration.
        out.copy(start, start + m[0].length).raw("\n;\n");
        continue;
      }
      if (!m[0].includes("@template")) continue;
      templateBlocks.push([start, start + m[0].length]);
      for (const line of m[0].split("\n"))
        if (line.includes("@template"))
          tags.push(
            ` * ${line.replace(JSDOC_LINE_START, "").replace(JSDOC_END, "")}`,
          );
      // The rest of the block (its description) stays where it was.
    }
    if (tags.length && !isTs) out.raw(`/**\n${tags.join("\n")}\n */\n`);
  }

  // --- Stores: `$name` is declared right after `name`, or at the start.
  const storeAfter = new Map<number, string[]>();
  const storeAtStart: string[] = [];
  const seenStores = new Set<string>();
  for (const scope of [scopes.instance, scopes.module])
    for (const b of scope?.declarations?.values() ?? [])
      for (const r of b.references) {
        if (!r.store || seenStores.has(b.name)) continue;
        seenStores.add(b.name);
        const decl = b.declaration;
        const top =
          scope === scopes.instance && b.kind !== "import"
            ? body.find(
                (s: Node) => decl && s.start <= decl.start && decl.end <= s.end,
              )
            : undefined;
        if (top)
          storeAfter.set(top.end, [...(storeAfter.get(top.end) ?? []), b.name]);
        else storeAtStart.push(b.name);
      }
  const declareStore = (name: string) =>
    `let $${name} = __sveltets_2_store_get(${name});`;

  out.raw(
    `function $$render${generics}() { let $$props = __sveltets_2_allPropsType(); let $$restProps = __sveltets_2_restPropsType(); let $$slots = __sveltets_2_any(0); ${storeAtStart.map(declareStore).join(" ")}\n`,
  );

  // --- Instance script, statement by statement.
  const props: { name: string; local: string; optional: boolean }[] = [];
  const exportsOf: string[] = [];
  /** Copies [from, to), leaving out `@template` blocks. */
  const copyGap = (from: number, to: number) => {
    let at = from;
    for (const [s, e] of templateBlocks) {
      if (e <= at || s >= to) continue;
      out.copy(at, s);
      at = e;
    }
    out.copy(at, to);
  };
  if (instance) {
    let cursor = instance.content.start;
    for (const s of body) {
      copyGap(cursor, s.start);
      cursor = s.end;
      if (s.type === "ImportDeclaration") continue;
      if (s.type === "ExportNamedDeclaration") {
        const d = s.declaration;
        if (d) {
          out.copy(d.start, d.end);
          if (d.type === "VariableDeclaration" && d.kind === "let")
            for (const decl of d.declarations)
              for (const name of idsOf(decl.id)) {
                props.push({ name, local: name, optional: decl.init != null });
                // Stops narrowing to the default; a parent can pass anything.
                out.raw(
                  `;${name} = __sveltets_2_any(${decl.init ? name : 0});`,
                );
              }
          else
            for (const name of d.declarations
              ? d.declarations.flatMap((x: Node) => idsOf(x.id))
              : [d.id?.name])
              if (name) exportsOf.push(name);
        } else
          for (const spec of s.specifiers) {
            const binding = scopes.instance.get(spec.local.name);
            if (binding?.kind === "let" || binding?.kind === "prop")
              props.push({
                name: spec.exported.name,
                local: spec.local.name,
                optional: true,
              });
          }
      } else if (s.type === "LabeledStatement" && s.label.name === "$") {
        const e =
          s.body.type === "ExpressionStatement" ? s.body.expression : null;
        const declares =
          e?.type === "AssignmentExpression" &&
          e.operator === "=" &&
          idsOf(e.left).some((n) => {
            const b = scopes.instance.get(n);
            return b?.kind === "reactive" && b.declaration?.start === s.start;
          });
        if (declares) {
          out.raw("let ").copy(e.left.start, e.left.end);
          out
            .raw(" = __sveltets_2_invalidate(() => (")
            .copy(e.right.start, e.right.end)
            .raw("));");
        } else out.raw(";() => {").copy(s.start, s.end).raw("}");
      } else out.copy(s.start, s.end);
      const stores = storeAfter.get(s.end);
      if (stores) out.raw(stores.map(declareStore).join(""));
    }
    copyGap(cursor, instance.content.end);
  }

  // --- Markup.
  const attrValue = (value: Node) => {
    if (value === true) return out.raw("true");
    const parts = Array.isArray(value) ? value : [value];
    if (parts.length === 1 && parts[0].type === "ExpressionTag")
      return out
        .raw("(")
        .copy(parts[0].expression.start, parts[0].expression.end)
        .raw(")");
    if (parts.every((p: Node) => p.type === "Text"))
      return out.from(parts[0]?.start ?? 0, () =>
        out.raw(JSON.stringify(parts.map((p: Node) => p.data).join(""))),
      );
    out.raw("`");
    for (const p of parts) {
      if (p.type === "Text")
        out.raw(p.data.replace(/[`\\]|\$\{/g, (c: string) => `\\${c}`));
      else out.raw("${").copy(p.expression.start, p.expression.end).raw("}");
    }
    return out.raw("`");
  };
  const key = (attribute: Node, name: string) =>
    out.from(attribute.start, () => out.raw(JSON.stringify(name))).raw(":");
  const nameAt = (attribute: Node) => source.indexOf(":", attribute.start) + 1;
  const expression = (node: Node) =>
    out.raw("(").copy(node.start, node.end).raw(")");

  /** Writes an element's directives that aren't attributes, after it. */
  const directives = (node: Node, element: string, tag: string) => {
    for (const a of node.attributes ?? []) {
      if (a.type === "BindDirective") {
        if (a.name === "this")
          out.copy(a.expression.start, a.expression.end).raw(` = ${element};`);
        else
          out
            .raw("() => ")
            .copy(a.expression.start, a.expression.end)
            .raw(" = __sveltets_2_any(null);");
      } else if (a.type === "ClassDirective") expression(a.expression).raw(";");
      else if (a.type === "StyleDirective") {
        if (a.value === true) {
          const at = nameAt(a);
          out.copy(at, at + a.name.length).raw(";");
        } else attrValue(a.value).raw(";");
      } else if (a.type === "TransitionDirective") {
        const at = nameAt(a);
        out.raw("__sveltets_2_ensureTransition(").copy(at, at + a.name.length);
        out.raw(`(svelteHTML.mapElementTag(${tag}),`);
        if (a.expression) out.copy(a.expression.start, a.expression.end);
        else out.raw("{}");
        out.raw("));");
      }
    }
  };

  const elementAttribute = (a: Node, inComponent: boolean) => {
    if (a.type === "Attribute") {
      if (inComponent && a.name === "slot") return;
      if (a.name.startsWith("data-")) {
        out.raw("...__sveltets_2_empty({");
        key(a, a.name);
        attrValue(a.value).raw("}),");
        return;
      }
      key(a, a.name);
      const only =
        Array.isArray(a.value) && a.value.length === 1 ? a.value[0] : null;
      if (a.value === true && a.name === "popover") out.raw('""');
      else if (
        only?.type === "Text" &&
        NUMBER_ATTRIBUTES.has(a.name.toLowerCase()) &&
        only.data.trim() !== "" &&
        !Number.isNaN(Number(only.data))
      )
        out.copy(only.start, only.end);
      else attrValue(a.value);
      out.raw(",");
    } else if (a.type === "SpreadAttribute")
      out.raw("...").copy(a.expression.start, a.expression.end).raw(",");
    else if (a.type === "OnDirective") {
      key(a, `on:${a.name}`);
      if (a.expression) expression(a.expression);
      else out.raw("undefined");
      out.raw(",");
    } else if (a.type === "BindDirective" && a.name !== "this") {
      key(a, `bind:${a.name}`);
      expression(a.expression).raw(",");
    }
  };
  const attributeKey = (a: Node) =>
    a.type === "Attribute"
      ? a.name
      : a.type === "OnDirective"
        ? `on:${a.name}`
        : a.type === "BindDirective"
          ? `bind:${a.name}`
          : null;

  const element = (
    node: Node,
    tag: () => void,
    tagText: string,
    inComponent: boolean,
  ) => {
    const id = `$$_el${uid++}`;
    // A key can't repeat in an object literal (several `on:click`s can), so
    // each repeat gets its own `createElement` call.
    const seen = new Set<string>();
    const repeats: Node[] = [];
    // Actions go first: what they return can add to the element's attributes.
    out.raw("{");
    const actions: string[] = [];
    for (const a of node.attributes ?? []) {
      if (a.type !== "UseDirective") continue;
      const action = `$$_action${uid++}`;
      actions.push(action);
      const at = nameAt(a);
      out
        .raw(`const ${action} = __sveltets_2_ensureAction(`)
        .copy(at, at + a.name.length);
      out.raw(`(svelteHTML.mapElementTag(${tagText})`);
      if (a.expression) out.raw(",").copy(a.expression.start, a.expression.end);
      out.raw("));");
    }
    out.raw(`const ${id} = `);
    out.from(node.start + 1, () => {
      out.raw("svelteHTML.createElement(");
      tag();
      out.raw(", ");
      if (actions.length) out.raw(`__sveltets_2_union(${actions.join(",")}), `);
      // An error about the whole attributes object points at the tag, or at
      // `<svelte:element this>`'s expression.
      out.from(node.tag?.start ?? node.start + 1, () => out.raw("{"));
      for (const a of node.attributes ?? []) {
        const k = attributeKey(a);
        if (k !== null && seen.has(k)) repeats.push(a);
        else {
          if (k !== null) seen.add(k);
          elementAttribute(a, inComponent);
        }
      }
      out.raw("})");
    });
    out.raw(";");
    for (const a of repeats)
      out.from(node.tag?.start ?? node.start + 1, () => {
        out.raw("svelteHTML.createElement(");
        tag();
        out.raw(", {");
        elementAttribute(a, inComponent);
        out.raw("});");
      });
    directives(node, id, tagText);
    fragment(node.fragment);
    out.raw("}\n");
  };

  /** A component's children: its default slot, named slots and snippets. */
  const slotOf = (child: Node) =>
    (child.attributes ?? []).find(
      (a: Node) => a.type === "Attribute" && a.name === "slot",
    );
  const lets = (node: Node) =>
    (node.attributes ?? []).filter((a: Node) => a.type === "LetDirective");
  const destructureLets = (directives: Node[], from: string) => {
    if (!directives.length) return;
    out.raw("const {");
    for (const d of directives) {
      const at = nameAt(d);
      if (d.expression)
        out.raw(`${d.name}:`).copy(d.expression.start, d.expression.end);
      else out.copy(at, at + d.name.length);
      out.raw(",");
    }
    out.raw(`} = ${from};`);
  };

  const component = (node: Node, ctor: () => void, inComponent = false) => {
    const id = `$$_c${uid++}`;
    const children: Node[] = node.fragment?.nodes ?? [];
    const snippets = children.filter((c) => c.type === "SnippetBlock");
    const named = children.filter(
      (c) => c.type !== "SnippetBlock" && slotOf(c),
    );
    const rest = children.filter(
      (c) => c.type !== "SnippetBlock" && !slotOf(c),
    );
    const hasDefault =
      rest.some((c) => c.type !== "Text" || c.data.trim()) &&
      !snippets.some((s) => s.expression.name === "children");
    out.raw(`{ const ${id}C = __sveltets_2_ensureComponent(`);
    ctor();
    out.raw("); ");
    out.from(node.start + 1, () => {
      out.raw(
        `const ${id} = new ${id}C({ target: __sveltets_2_any(), props: {`,
      );
      if (hasDefault)
        out.raw("children:() => { return __sveltets_2_any(0); },");
      for (const a of node.attributes ?? []) {
        if (a.type === "Attribute") {
          if (inComponent && a.name === "slot") continue;
          key(a, a.name);
          attrValue(a.value).raw(",");
        } else if (a.type === "SpreadAttribute")
          out.raw("...").copy(a.expression.start, a.expression.end).raw(",");
        else if (a.type === "BindDirective" && a.name !== "this") {
          key(a, a.name);
          out.copy(a.expression.start, a.expression.end).raw(",");
        }
      }
      for (const s of snippets) {
        out.from(s.expression.start, () =>
          out.raw(JSON.stringify(s.expression.name)),
        );
        out.raw(":(");
        s.parameters.forEach((p: Node, i: number) => {
          if (i) out.raw(",");
          out.copy(p.start, p.end);
        });
        out.raw(") => { async () => {");
        fragment(s.body);
        out.raw("}; return __sveltets_2_any(0); },");
      }
      out.raw("} });");
    });
    for (const a of node.attributes ?? []) {
      if (a.type === "BindDirective") {
        if (a.name === "this")
          out.copy(a.expression.start, a.expression.end).raw(` = ${id};`);
        else
          out
            .raw("() => ")
            .copy(a.expression.start, a.expression.end)
            .raw(" = __sveltets_2_any(null);");
      } else if (a.type === "OnDirective" && a.expression) {
        out.from(nameAt(a), () =>
          out.raw(`${id}.$on(${JSON.stringify(a.name)}, `),
        );
        out.copy(a.expression.start, a.expression.end).raw(");");
      }
    }
    out.raw("{");
    destructureLets(lets(node), `${id}.$$slot_def.default`);
    consts(rest);
    for (const c of rest) child(c, true);
    out.raw("}");
    for (const c of named) {
      out.raw("{");
      destructureLets(
        lets(c),
        `${id}.$$slot_def[${JSON.stringify(textOf(slotOf(c)))}]`,
      );
      if (c.type === "SvelteFragment") fragment(c.fragment);
      else child(c, true);
      out.raw("}");
    }
    out.raw("}\n");
  };

  const child = (node: Node, inComponent = false) => {
    switch (node.type) {
      case "Text":
      case "Comment":
      case "DebugTag":
      case "ConstTag":
        return;
      case "ExpressionTag":
      case "HtmlTag":
      case "RenderTag":
        return expression(node.expression).raw(";");
      case "RegularElement":
        return element(
          node,
          () => out.raw(JSON.stringify(node.name)),
          JSON.stringify(node.name),
          inComponent,
        );
      case "SvelteElement":
        return element(
          node,
          () => expression(node.tag),
          "__sveltets_2_any(0)",
          inComponent,
        );
      case "SvelteWindow":
      case "SvelteBody":
      case "SvelteDocument":
        return element(
          node,
          () => out.raw(JSON.stringify(node.name)),
          "__sveltets_2_any(0)",
          false,
        );
      case "SvelteHead":
      case "SvelteFragment":
      case "TitleElement":
      case "SvelteBoundary":
        return fragment(node.fragment);
      case "SvelteOptions":
        return;
      case "Component":
        return component(
          node,
          () => {
            const at = node.start + 1;
            out.copy(at, at + node.name.length);
          },
          inComponent,
        );
      case "SvelteComponent":
        return component(node, () => expression(node.expression), inComponent);
      case "SvelteSelf":
        return component(node, () => out.raw("__sveltets_2_any(0)"));
      case "SlotElement": {
        const nameAttr = (node.attributes ?? []).find(
          (a: Node) => a.type === "Attribute" && a.name === "name",
        );
        slots.add(nameAttr ? textOf(nameAttr) : "default");
        out.raw("({");
        for (const a of node.attributes ?? [])
          if (a.type === "Attribute" && a.name !== "name") {
            key(a, a.name);
            attrValue(a.value).raw(",");
          } else if (a.type === "SpreadAttribute")
            out.raw("...").copy(a.expression.start, a.expression.end).raw(",");
        out.raw("});{");
        fragment(node.fragment);
        return out.raw("}\n");
      }
      case "IfBlock":
        out.raw("if (");
        expression(node.test).raw(") {");
        fragment(node.consequent);
        out.raw("}");
        if (node.alternate) {
          out.raw(" else {");
          fragment(node.alternate);
          out.raw("}");
        }
        return out.raw("\n");
      case "EachBlock":
        out.raw("for (let ");
        if (node.context) out.copy(node.context.start, node.context.end);
        else out.raw("$$_item");
        out.raw(" of __sveltets_2_ensureArray(");
        out.copy(node.expression.start, node.expression.end).raw(")) {");
        if (node.index) out.raw(`let ${node.index} = 1;`);
        if (node.key) expression(node.key).raw(";");
        fragment(node.body);
        out.raw("}");
        if (node.fallback) {
          out.raw("{");
          fragment(node.fallback);
          out.raw("}");
        }
        return out.raw("\n");
      case "AwaitBlock": {
        const p = `$$_p${uid++}`;
        out.raw(`{ const ${p} = `);
        expression(node.expression).raw(";{");
        fragment(node.pending);
        out.raw("}{ const ");
        if (node.value) out.copy(node.value.start, node.value.end);
        else out.raw("$$_v");
        out.raw(` = await ${p};`);
        fragment(node.then);
        out.raw("}{ const ");
        if (node.error) out.copy(node.error.start, node.error.end);
        else out.raw("$$_e");
        out.raw(" = __sveltets_2_any(0);");
        fragment(node.catch);
        return out.raw("}}\n");
      }
      case "KeyBlock":
        expression(node.expression).raw(";");
        return fragment(node.fragment);
      case "SnippetBlock": {
        out
          .raw("function ")
          .copy(node.expression.start, node.expression.end)
          .raw("(");
        node.parameters.forEach((p: Node, i: number) => {
          if (i) out.raw(",");
          out.copy(p.start, p.end);
        });
        out.raw(") { async () => {");
        fragment(node.body);
        return out.raw("}; return __sveltets_2_any(0); }\n");
      }
      default:
        if (node.fragment) fragment(node.fragment);
    }
  };

  /** `{@const}` tags first: they're visible to the whole fragment. */
  function fragment(f: Node) {
    if (!f) return;
    consts(f.nodes);
    for (const n of f.nodes) child(n);
  }
  function consts(nodes: Node[]) {
    for (const n of nodes)
      if (n.type === "ConstTag") {
        const d = n.declaration;
        out
          .raw("const ")
          .copy(d.declarations[0].start, d.declarations[0].end)
          .raw(";");
      }
  }

  out.raw("\nasync () => {\n");
  fragment(ast.fragment);
  out.raw("};\n");

  // --- What the component exposes. With `accessors`, props are exports too.
  const accessors = ast.options?.attributes?.some(
    (a: Node) => a.name === "accessors" && a.value !== false,
  );
  out.raw(
    `return { props: {${props.map((p) => `${JSON.stringify(p.name)}: ${p.local}`).join(", ")}}, exports: {${[...(accessors ? props.map((p) => `${JSON.stringify(p.name)}: ${p.local}`) : []), ...exportsOf.map((e) => `${e}: ${e}`)].join(", ")}}, bindings: "", slots: {${[...slots].map((n) => `${JSON.stringify(n)}: {}`).join(", ")}}, events: {} };\n}\n`,
  );
  const optional = props
    .filter((p) => p.optional)
    .map((p) => JSON.stringify(p.name));
  // `$$restProps` or `$$props` lets a parent pass any prop.
  const anyProp = USES_ALL_PROPS.test(source);
  out.raw(
    `const $$Component = __sveltets_2_isomorphic_component${slots.size ? "_slots" : ""}(__sveltets_2_partial${anyProp ? "_with_any" : ""}(${optional.length ? `[${optional.join(",")}], ` : ""}__sveltets_2_with_any_event($$render())));\n`,
  );
  if (isTs) out.raw("type $$Component = InstanceType<typeof $$Component>;\n");
  else
    out.raw("/** @typedef {InstanceType<typeof $$Component>} $$Component */\n");
  out.raw("export default $$Component;\n");

  return { out, isTs };
}
