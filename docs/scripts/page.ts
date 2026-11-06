/**
 * Compiles a docs page (`.md`, Markdown with Svelte in it) to a Svelte
 * component, as mdsvex did with the site's options: front matter becomes
 * a module script's `metadata`, the Markdown becomes HTML through the
 * site's remark and rehype plugins, code blocks go through `highlight`,
 * and the markup is wrapped in the page's layout.
 */
import { parseFrontmatter } from "./frontmatter.ts";
import { type Node, parseMarkdown, type Root } from "./markdown.ts";
import { visit } from "./visit.ts";

type File = { filename: string };
type Transformer = (tree: Root, file: File) => void | Promise<void>;
export type Plugin = () => Transformer;

export type PageOptions = {
  remarkPlugins?: Plugin[];
  rehypePlugins?: Plugin[];
  /** HTML for a fenced code block. */
  highlight: (code: string, lang: string | null, meta: string | null) => string;
  /** Layout component paths: a front matter `layout` names one, `_` is the rest. */
  layouts: Record<string, string>;
};

// mdsvex's escapes: code shows braces and angle brackets as text, and a
// lone `<` or `>` in text stays text.
const CODE_ESCAPES: [RegExp, string][] = [
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/{/g, "&#123;"],
  [/}/g, "&#125;"],
];
const TEXT_ESCAPES: [RegExp, string][] = [
  [/\\</g, "&lt;"],
  [/^>$/g, "&gt;"],
  [/^<$/g, "&lt;"],
];

function escape(tree: Root) {
  visit(tree, (node) => {
    const escapes =
      node.type === "inlineCode"
        ? CODE_ESCAPES
        : node.type === "text"
          ? TEXT_ESCAPES
          : undefined;
    const n = node as Node;
    for (const [re, replacement] of escapes ?? []) {
      n.value = n.value?.replace(re, replacement);
    }
  });
}

// mdast to hast, as mdast-util-to-hast 10 converts what the pages use.

export type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const newline = (): HastNode => ({ type: "text", value: "\n" });

/** `nodes` with a newline between each, and around them if `loose`. */
function wrap(nodes: HastNode[], loose = false): HastNode[] {
  const result: HastNode[] = loose ? [newline()] : [];
  nodes.forEach((node, i) => {
    if (i) result.push(newline());
    result.push(node);
  });
  if (loose && nodes.length) result.push(newline());
  return result;
}

function element(
  node: Node | null,
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[],
): HastNode {
  const data = node?.data as
    { hName?: string; hProperties?: Record<string, unknown> } | undefined;
  return {
    type: "element",
    tagName: data?.hName ?? tagName,
    properties: { ...properties, ...data?.hProperties },
    children,
  };
}

// Characters a URL keeps; the rest are percent-encoded, as mdurl does.
const URL_SAFE_RE = /[A-Za-z0-9;/?:@&=+$,\-_.!~*'()#]/;

function encodeUrl(url: string): string {
  let out = "";
  for (let i = 0; i < url.length; i++) {
    const char = url[i];
    if (char === "%" && /^[0-9a-f]{2}$/i.test(url.slice(i + 1, i + 3))) {
      out += url.slice(i, i + 3);
      i += 2;
    } else if (URL_SAFE_RE.test(char)) {
      out += char;
    } else {
      out += encodeURIComponent(char);
    }
  }
  return out;
}

function children(node: Node): HastNode[] {
  return (node.children ?? []).flatMap((child) => {
    const converted = toHast(child, node);
    return converted ? [converted] : [];
  });
}

export function toHast(node: Node, parent?: Node): HastNode | null {
  switch (node.type) {
    case "root":
      return { type: "root", children: wrap(children(node)) };
    case "yaml":
      return null;
    case "html":
      return { type: "raw", value: node.value };
    case "text":
      return {
        type: "text",
        value: String(node.value).replace(/[ \t]*(\r?\n|\r)[ \t]*/g, "$1"),
      };
    case "paragraph":
      return element(node, "p", {}, children(node));
    case "heading":
      return element(node, `h${node.depth}`, {}, children(node));
    case "strong":
      return element(node, "strong", {}, children(node));
    case "emphasis":
      return element(node, "em", {}, children(node));
    case "inlineCode":
      return element(node, "code", {}, [
        { type: "text", value: String(node.value).replace(/\r?\n|\r/g, " ") },
      ]);
    case "link": {
      const properties: Record<string, unknown> = {
        href: encodeUrl(String(node.url)),
      };
      if (node.title !== null && node.title !== undefined) {
        properties.title = node.title;
      }
      return element(node, "a", properties, children(node));
    }
    case "list": {
      const properties: Record<string, unknown> = {};
      if (typeof node.start === "number" && node.start !== 1) {
        properties.start = node.start;
      }
      return element(
        node,
        node.ordered ? "ol" : "ul",
        properties,
        wrap(children(node), true),
      );
    }
    case "listItem": {
      const loose =
        parent?.spread === true ||
        (parent?.children ?? []).some((item) => item.spread === true);
      const wrapped: HastNode[] = [];
      const result = children(node);
      result.forEach((child, i) => {
        if (loose || i !== 0 || child.tagName !== "p") wrapped.push(newline());
        if (child.tagName === "p" && !loose)
          wrapped.push(...(child.children ?? []));
        else wrapped.push(child);
      });
      const last = result.at(-1);
      if (last && (loose || last.tagName !== "p")) wrapped.push(newline());
      return element(node, "li", {}, wrapped);
    }
    case "table": {
      const align = (node.align as (string | null)[] | undefined) ?? [];
      const rows = (node.children ?? []).map((row, index) => {
        const cells = row.children ?? [];
        const count = align.length || cells.length;
        const out: HastNode[] = [];
        for (let i = 0; i < count; i++) {
          const cell = cells[i];
          const properties = align[i] ? { align: align[i] } : {};
          out.push(
            element(
              cell ?? null,
              index === 0 ? "th" : "td",
              properties,
              cell ? children(cell) : [],
            ),
          );
        }
        return element(row, "tr", {}, wrap(out, true));
      });
      const sections = [element(null, "thead", {}, wrap([rows[0]], true))];
      if (rows.length > 1) {
        sections.push(element(null, "tbody", {}, wrap(rows.slice(1), true)));
      }
      return element(node, "table", {}, wrap(sections, true));
    }
    default:
      throw new Error(`Unsupported mdast node: ${node.type}`);
  }
}

// hast to HTML.

const VOID_ELEMENTS = new Set(["br", "hr", "img", "input", "wbr"]);

function attributeName(name: string): string {
  if (name === "className") return "class";
  return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function attributes(properties: Record<string, unknown>): string {
  let out = "";
  for (const [name, value] of Object.entries(properties)) {
    if (value === null || value === undefined || value === false) continue;
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    out += ` ${attributeName(name)}="${text.replace(/"/g, "&quot;")}"`;
  }
  return out;
}

export function toHtml(node: HastNode): string {
  switch (node.type) {
    case "root":
      return (node.children ?? []).map(toHtml).join("");
    case "text":
    case "raw":
      return node.value ?? "";
    case "element": {
      const open = `<${node.tagName}${attributes(node.properties ?? {})}>`;
      if (VOID_ELEMENTS.has(node.tagName ?? "")) return open;
      return `${open}${(node.children ?? []).map(toHtml).join("")}</${node.tagName}>`;
    }
    default:
      throw new Error(`Unsupported hast node: ${node.type}`);
  }
}

// Assembling the component.

const SCRIPT_RE = /^<script\b/i;
const SCRIPT_OPEN_RE = /^<script\b[^>]*>/i;
const MODULE_SCRIPT_RE = /^<script\b[^>]*\bcontext=["']?module/i;
const STYLE_RE = /^<style\b/i;
const SPECIAL_RE = /^<svelte:(options|head|window|body)\b/;

export async function compilePage(
  source: string,
  filename: string,
  options: PageOptions,
): Promise<string> {
  const file = { filename };
  const tree = parseMarkdown(source);
  const yaml =
    tree.children[0]?.type === "yaml" ? tree.children[0].value : undefined;
  const metadata = yaml === undefined ? undefined : parseFrontmatter(yaml);

  escape(tree);
  for (const plugin of options.remarkPlugins ?? []) {
    // eslint-disable-next-line no-await-in-loop -- each plugin sees the last one's tree
    await plugin()(tree, file);
  }
  visit(tree, "code", (node: Node) => {
    node.type = "html";
    node.value = options.highlight(
      String(node.value),
      (node.lang as string | null) ?? null,
      (node.meta as string | null) ?? null,
    );
  });

  const hast = toHast(tree) as HastNode;
  for (const plugin of options.rehypePlugins ?? []) {
    // eslint-disable-next-line no-await-in-loop -- each plugin sees the last one's tree
    await plugin()(hast as unknown as Root, file);
  }
  visit(hast as unknown as Root, "element", (node: HastNode) => {
    const href = node.properties?.href;
    if (node.tagName === "a" && typeof href === "string") {
      (node.properties as Record<string, unknown>).href = href
        .replace(/%7B/g, "{")
        .replace(/%7D/g, "}");
    }
  });

  const parts = {
    module: [] as string[],
    instance: [] as string[],
    css: [] as string[],
    special: [] as string[],
    html: [] as string[],
  };
  let lastBlank = false;
  for (const node of hast.children ?? []) {
    const html = toHtml(node);
    const blank = node.type === "text" && /^\n+$|^\s+$/.test(html);
    if (node.type !== "raw") {
      if (!(blank && lastBlank)) parts.html.push(html);
      lastBlank = blank;
      continue;
    }
    lastBlank = false;
    const part = SCRIPT_RE.test(html)
      ? MODULE_SCRIPT_RE.test(html)
        ? "module"
        : "instance"
      : STYLE_RE.test(html)
        ? "css"
        : SPECIAL_RE.test(html)
          ? "special"
          : "html";
    parts[part].push(html);
  }

  const layoutName = metadata?.layout;
  const layout =
    typeof layoutName === "string"
      ? options.layouts[layoutName]
      : options.layouts._;
  if (!layout) throw new Error(`${filename}: no layout ${String(layoutName)}`);
  const importLayout = `import PageLayout from '${layout}';`;
  if (parts.instance[0]) {
    parts.instance[0] = parts.instance[0].replace(
      SCRIPT_OPEN_RE,
      `$&\n\t${importLayout}`,
    );
  } else {
    parts.instance.push(`\n<script>\n\t${importLayout}\n</script>\n`);
  }

  if (metadata) {
    const stringified = JSON.stringify(metadata).replace(
      /<(\/?script|\/?style)/gi,
      '<"+"$1',
    );
    const names = Object.keys(metadata)
      .map((key) =>
        key.includes("-") ? `'${key}': ${key.replace(/-/g, "_")}` : key,
      )
      .join(", ");
    const fm = `export const metadata = ${stringified};\n\tconst { ${names} } = metadata;`;
    if (parts.module[0]) {
      parts.module[0] = parts.module[0].replace(
        SCRIPT_OPEN_RE,
        (open) => `${open}\n\t${fm}`,
      );
    } else {
      parts.module.push(`<script context="module">\n\t${fm}\n</script>`);
    }
  }

  const after = (list: string[]) => (list[0] ? "\n" : "");
  return [
    ...parts.module,
    after(parts.module),
    ...parts.instance,
    after(parts.instance),
    ...parts.css,
    after(parts.css),
    ...parts.special,
    after(parts.special),
    `<PageLayout {...$$props}${metadata ? " {...metadata}" : ""}>`,
    "\n",
    ...parts.html,
    "\n",
    "</PageLayout>",
  ].join("");
}
