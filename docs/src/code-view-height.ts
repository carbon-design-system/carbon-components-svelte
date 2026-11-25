/**
 * Must match CodeSnippet's rendered height exactly: Safari doesn't anchor
 * the scroll, so a wrong guess moves the page. `e2e/code-view-height.test.ts`
 * checks it.
 */
export function codeViewHeight(code: string): string {
  // A trailing newline doesn't render a line of its own.
  const lines = code.replace(/\n$/, "").split("\n").length;
  // The room for the "Show more" button sits past the 15-row cap, so it
  // never adds to the height.
  return `calc(clamp(3rem, ${lines}rem, 15rem) + 2rem)`;
}
