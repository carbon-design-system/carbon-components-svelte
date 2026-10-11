// carbon-components-svelte usage lint for REPL files. Runs in the compiler
// worker (classic script, loaded with importScripts) and in unit tests.
// Checks every Carbon component in the markup against the compact api.json:
// unknown props (with "did you mean"), events the component never dispatches
// or forwards, bind: to a non-prop, and family components rendered outside
// the parent whose context they require.

(() => {
  const ALWAYS_OK = new Set(["class", "style", "slot", "id"]);
  // biome-ignore lint/performance/useTopLevelRegex: classic worker script, scoped in this IIFE on purpose
  const HTML_PASSTHROUGH = /^(aria-|data-)|^on[a-z]+$|^[a-z]+$/;
  const NESTED_KEYS = [
    "fragment",
    "consequent",
    "alternate",
    "body",
    "fallback",
    "pending",
    "then",
    "catch",
  ];

  /** Optimal string alignment distance: a swap of two neighbors is one edit. */
  function distance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost,
        );
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }

  /**
   * Closest candidate: a case-insensitive match, or within one edit for short
   * names and two for longer ones (so "kind" doesn't suggest "id").
   */
  function suggest(name, candidates) {
    const lower = name.toLowerCase();
    const limit = name.length <= 4 ? 1 : 2;
    let best;
    let bestScore = limit + 1;
    for (const c of candidates) {
      if (c.toLowerCase() === lower) return c;
      const score = distance(name, c);
      if (score < bestScore) {
        best = c;
        bestScore = score;
      }
    }
    return best;
  }

  function collectImports(program, api) {
    const byPath = new Map(
      Object.entries(api.components).map(([name, c]) => [c.path, name]),
    );
    /** @type {Map<string, string>} local name → exported component name */
    const components = new Map();
    for (const node of program?.body ?? []) {
      if (node.type !== "ImportDeclaration") continue;
      const source = node.source.value;
      if (source === "carbon-components-svelte") {
        for (const s of node.specifiers) {
          if (s.type === "ImportSpecifier" && api.components[s.imported.name]) {
            components.set(s.local.name, s.imported.name);
          }
        }
      } else if (source.startsWith("carbon-components-svelte/")) {
        const name = byPath.get(
          source.slice("carbon-components-svelte/".length),
        );
        const local = node.specifiers.find(
          (s) => s.type === "ImportDefaultSpecifier",
        );
        if (name && local) components.set(local.local.name, name);
      }
    }
    return components;
  }

  function walk(fragment, ancestors, visit) {
    for (const node of fragment?.nodes ?? []) {
      visit(node, ancestors);
      const next = node.type === "Component" ? [...ancestors, node] : ancestors;
      for (const key of NESTED_KEYS) {
        const child = node[key];
        if (child && Array.isArray(child.nodes)) walk(child, next, visit);
      }
    }
  }

  /**
   * @param {string} source
   * @param {string} filename
   * @param {{ api: any; parse: (source: string, options: object) => any; isEntry: boolean }} context
   */
  function lint(source, filename, { api, parse, isEntry }) {
    let ast;
    try {
      ast = parse(source, { modern: true, filename });
    } catch {
      return []; // the compiler reports syntax errors
    }
    const imports = collectImports(ast.instance?.content, api);
    if (!imports.size) return [];
    const importedNames = new Set(imports.values());
    const diagnostics = [];
    const report = (code, message, start, end) =>
      diagnostics.push({
        file: filename,
        severity: "warning",
        code,
        message,
        start,
        end,
      });

    walk(ast.fragment, [], (node, ancestors) => {
      if (node.type !== "Component") return;
      const name = imports.get(node.name);
      if (!name) return;
      const component = api.components[name];
      const props = component.props.map((p) => p.name);
      const propSet = new Set(props);
      const events = component.events.map((e) => e.name);
      const hasRest = !!component.rest;
      const restLabel = component.rest
        ? component.rest.type === "Element"
          ? `<${component.rest.name}>`
          : component.rest.name
        : "";

      for (const attr of node.attributes) {
        if (attr.type === "Attribute") {
          if (propSet.has(attr.name) || ALWAYS_OK.has(attr.name)) continue;
          const close = suggest(attr.name, props);
          if (close && close !== attr.name) {
            report(
              "ccs/unknown-prop",
              `${name} has no prop "${attr.name}". Did you mean "${close}"?`,
              attr.start,
              attr.start + attr.name.length,
            );
          } else if (!hasRest) {
            report(
              "ccs/unknown-prop",
              `${name} has no prop "${attr.name}" and doesn't pass attributes through, so it's ignored.`,
              attr.start,
              attr.start + attr.name.length,
            );
          } else if (!HTML_PASSTHROUGH.test(attr.name)) {
            report(
              "ccs/unknown-prop",
              `${name} has no prop "${attr.name}"; it's passed to ${restLabel} as an attribute.`,
              attr.start,
              attr.start + attr.name.length,
            );
          }
        } else if (attr.type === "BindDirective") {
          if (attr.name === "this" || propSet.has(attr.name)) continue;
          const close = suggest(attr.name, props);
          report(
            "ccs/unknown-prop",
            `${name} has no prop "${attr.name}" to bind${close ? `. Did you mean "${close}"?` : "."}`,
            attr.start,
            attr.end,
          );
        } else if (attr.type === "OnDirective") {
          if (events.includes(attr.name)) continue;
          const close = suggest(attr.name, events);
          report(
            "ccs/unknown-event",
            `${name} never dispatches or forwards "${attr.name}", so this handler won't run${close ? `. Did you mean "on:${close}"?` : "."}`,
            attr.start,
            attr.end,
          );
        }
      }

      for (const alternatives of component.requires ?? []) {
        const providers = alternatives.flatMap(
          (key) => api.providers[key] ?? [],
        );
        const inside = ancestors.some((a) =>
          providers.includes(imports.get(a.name)),
        );
        if (inside) continue;
        if (!isEntry && !providers.some((p) => importedNames.has(p))) continue;
        report(
          "ccs/missing-parent",
          `${name} must be inside ${providers.join(" or ")}; it reads the "${alternatives[0]}" context and throws without one.`,
          node.start,
          node.start + 1 + node.name.length,
        );
      }
    });
    return diagnostics;
  }

  globalThis.ccsLint = { lint, suggest, distance };
})();
