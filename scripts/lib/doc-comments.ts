/**
 * Removes `/** ... *\/` doc comments from published `.js` and `.svelte`
 * source. They only feed sveld, which has already written the `.d.ts` files
 * (the source of editor hovers) by the time this runs, and bundlers drop
 * them anyway, so they are dead weight in the tarball (~450 KB unpacked).
 *
 * Comments are located with the TypeScript parser, so `/**` inside strings,
 * templates and regexes is never touched. Plain `/* *\/` comments (pure
 * annotations, lint suppressions) and markup comments (`svelte-ignore`) are
 * kept. scripts/strip-doc-comments.ts verifies every rewrite compiles to the
 * same code before writing it.
 */
import ts from "typescript";

const SCRIPT_RE = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/gi;

export function docCommentRanges(code: string): [number, number][] {
  const source = ts.createSourceFile(
    "source.js",
    code,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  const ranges = new Map<number, number>();
  const collect = (pos: number) => {
    for (const range of [
      ...(ts.getLeadingCommentRanges(code, pos) ?? []),
      ...(ts.getTrailingCommentRanges(code, pos) ?? []),
    ]) {
      if (
        range.kind === ts.SyntaxKind.MultiLineCommentTrivia &&
        code.startsWith("/**", range.pos) &&
        !code.startsWith("/**/", range.pos)
      ) {
        ranges.set(range.pos, range.end);
      }
    }
  };
  const visit = (node: ts.Node) => {
    collect(node.pos);
    collect(node.end);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return [...ranges].sort(([a], [b]) => a - b);
}

export function stripDocComments(code: string): string {
  let out = "";
  let cursor = 0;

  for (const [start, end] of docCommentRanges(code)) {
    if (start < cursor) continue;
    const lineStart = code.lastIndexOf("\n", start - 1) + 1;
    const newline = code.indexOf("\n", end);
    const lineEnd = newline === -1 ? code.length : newline + 1;
    const ownsLine =
      code.slice(lineStart, start).trim() === "" &&
      code.slice(end, lineEnd).trim() === "";

    if (ownsLine) {
      out += code.slice(cursor, lineStart);
      cursor = lineEnd;
    } else {
      // A multi-line comment counts as a line terminator for ASI, so keep one.
      out += code.slice(cursor, start);
      out += code.slice(start, end).includes("\n") ? "\n" : "";
      cursor = end;
    }
  }

  return out + code.slice(cursor);
}

export function stripSvelteDocComments(code: string): string {
  return code.replace(
    SCRIPT_RE,
    (_, open: string, body: string, close: string) =>
      open + stripDocComments(body) + close,
  );
}
