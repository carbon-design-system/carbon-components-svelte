import html from "@shikijs/langs/html";
import javascript from "@shikijs/langs/javascript";
import svelte from "@shikijs/langs/svelte";
import typescript from "@shikijs/langs/typescript";
import type { LanguageRegistration, ThemeRegistration } from "@shikijs/types";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export const CARBON_LIGHT_THEME = "carbon-light" as const;
export const CARBON_DARK_THEME = "carbon-dark" as const;

const LANG_ALIASES = {
  js: "javascript",
  ts: "typescript",
  html: "html",
  svg: "html",
  markup: "html",
} as const;

const LITERAL_STRUCTURE_SCOPES = [
  "meta.brace.square.ts",
  "meta.brace.curly.ts",
  "meta.brace.round.ts",
  "meta.array.literal.ts",
  "meta.brace.square.js",
  "meta.brace.curly.js",
  "meta.brace.round.js",
  "meta.array.literal.js",
] as const;

const EMBEDDED_LITERAL_PROPERTY_SCOPES = [
  "meta.object-literal.key.ts",
  "meta.object.member.ts",
  "meta.objectliteral.ts",
  "meta.object-literal.key.js",
  "meta.object.member.js",
  "meta.objectliteral.js",
] as const;

const carbonDark = {
  name: CARBON_DARK_THEME,
  colors: {
    "editor.background": "#00000000",
    "editor.foreground": "#f4f4f4",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#bebebe" },
    },
    { scope: ["string", "string.quoted"], settings: { foreground: "#fa75a6" } },
    {
      scope: ["constant.numeric", "constant.language.numeric"],
      settings: { foreground: "#a7f0ba" },
    },
    {
      scope: [
        "keyword",
        "storage.type",
        "storage.modifier",
        "constant.language.boolean",
      ],
      settings: { foreground: "#bb8eff" },
    },
    {
      scope: [
        "entity.name.tag",
        "entity.name.tag.svelte",
        "keyword.control.svelte",
        "support.class",
        "punctuation.definition.tag",
        "keyword.operator",
        "punctuation.separator",
      ],
      settings: { foreground: "#6ea6ff" },
    },
    {
      scope: [
        "entity.other.attribute-name",
        "support.type",
        "variable.language",
      ],
      settings: { foreground: "#3ddbd9" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#9ef0f0" },
    },
    {
      scope: [
        "string.quoted.attribute-value",
        "meta.embedded.line.js",
        "source.js",
        ...EMBEDDED_LITERAL_PROPERTY_SCOPES,
      ],
      settings: { foreground: "#d4bbff" },
    },
    {
      scope: [...LITERAL_STRUCTURE_SCOPES],
      settings: { foreground: "#a8a8a8" },
    },
    { scope: ["punctuation"], settings: { foreground: "#a8a8a8" } },
  ],
} satisfies ThemeRegistration;

const carbonLight = {
  name: CARBON_LIGHT_THEME,
  colors: {
    "editor.background": "#00000000",
    "editor.foreground": "#161616",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#6f6f6f" },
    },
    { scope: ["string", "string.quoted"], settings: { foreground: "#9f1853" } },
    {
      scope: ["constant.numeric", "constant.language.numeric"],
      settings: { foreground: "#0e6027" },
    },
    {
      scope: [
        "keyword",
        "storage.type",
        "storage.modifier",
        "constant.language.boolean",
      ],
      settings: { foreground: "#6929c4" },
    },
    {
      scope: [
        "entity.name.tag",
        "entity.name.tag.svelte",
        "keyword.control.svelte",
        "support.class",
        "punctuation.definition.tag",
        "keyword.operator",
        "punctuation.separator",
      ],
      settings: { foreground: "#0043ce" },
    },
    {
      scope: [
        "entity.other.attribute-name",
        "support.type",
        "variable.language",
      ],
      settings: { foreground: "#005d5d" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#007d79" },
    },
    {
      scope: [
        "string.quoted.attribute-value",
        "meta.embedded.line.js",
        "source.js",
        ...EMBEDDED_LITERAL_PROPERTY_SCOPES,
      ],
      settings: { foreground: "#8a3ffc" },
    },
    {
      scope: [...LITERAL_STRUCTURE_SCOPES],
      settings: { foreground: "#525252" },
    },
    { scope: ["punctuation"], settings: { foreground: "#525252" } },
  ],
} satisfies ThemeRegistration;

const langs = [
  ...svelte,
  ...typescript,
  ...javascript,
  ...html,
] satisfies LanguageRegistration[];

const SHIKI_THEMES = {
  light: CARBON_LIGHT_THEME,
  dark: CARBON_DARK_THEME,
} as const;

const PRE_CODE_RE = /^<pre[^>]*><code[^>]*>([\s\S]*)<\/code><\/pre>$/;
const SHIKI_FRAGMENT_CLASS =
  `shiki shiki-themes ${CARBON_LIGHT_THEME} ${CARBON_DARK_THEME}` as const;

const EXAMPLE_CODE_BLOCK_REGEX = /```svelte\s*\n([\s\S]*?)```/;

let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [carbonDark, carbonLight],
    langs,
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

export function normalizeLang(lang: string | null | undefined): string {
  const raw = lang?.toLowerCase().trim() ?? "";
  if (!raw) return "text";
  return LANG_ALIASES[raw as keyof typeof LANG_ALIASES] ?? raw;
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function stripPreCodeWrapper(html: string): string {
  const match = html.match(PRE_CODE_RE);
  return match ? match[1] : html;
}

export function wrapShikiFragment(innerHtml: string): string {
  return `<span class="${SHIKI_FRAGMENT_CLASS}">${innerHtml}</span>`;
}

export async function highlightCode(
  code: string,
  lang: string | null | undefined,
  options: { fragment?: boolean } = {},
): Promise<string> {
  const normalized = normalizeLang(lang);
  if (normalized === "text" || !code) {
    return options.fragment
      ? escapeHtmlText(code)
      : `<pre><code>${escapeHtmlText(code)}</code></pre>`;
  }

  const highlighter = await getHighlighter();
  if (!highlighter.getLoadedLanguages().includes(normalized)) {
    const escaped = escapeHtmlText(code);
    return options.fragment ? escaped : `<pre><code>${escaped}</code></pre>`;
  }

  const htmlOutput = highlighter.codeToHtml(code, {
    lang: normalized,
    themes: SHIKI_THEMES,
    defaultColor: false,
  });

  if (options.fragment) {
    return wrapShikiFragment(stripPreCodeWrapper(htmlOutput));
  }

  return htmlOutput;
}

export function extractExampleCode(description: string): string | null {
  const exampleIndex = description.indexOf("@example");
  if (exampleIndex === -1) return null;
  const exampleSection = description.slice(exampleIndex);
  const match = exampleSection.match(EXAMPLE_CODE_BLOCK_REGEX);
  return match ? match[1].trim() : null;
}
