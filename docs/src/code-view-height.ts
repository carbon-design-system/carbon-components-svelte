/**
 * Must match CodeSnippet's rendered height exactly: Safari doesn't anchor
 * the scroll, so a wrong guess moves the page. `e2e/code-view-height.test.ts`
 * checks it.
 */
export function codeViewHeight(code: string): string {
  // A trailing newline doesn't render a line of its own.
  const lines = code.replace(/\n$/, "").split("\n").length;
  return `calc(clamp(3rem, ${lines}rem + 1.5rem, 15rem) + 2rem)`;
}
