/**
 * A code view's height once rendered, as a CSS length, which the view
 * reserves while the browser skips it as off-screen and its placeholder
 * takes until its snippet renders: a 1rem row a line and the code's 1.5rem
 * bottom padding, at least the snippet's 48 px and at most its collapsed
 * 240 px, which CodeSnippet sets in pixels, plus 2rem around them, inside
 * the view's border. In rem, it follows the reader's font size as the
 * snippet does.
 *
 * With a guess instead, a view above the reader changed height as it
 * rendered and moved the page in Safari, which doesn't anchor the scroll.
 * `e2e/code-view-height.test.ts` checks it against CodeSnippet.
 */
export function codeViewHeight(code: string): string {
  // A trailing newline doesn't render a line of its own.
  const lines = code.replace(/\n$/, "").split("\n").length;
  return `calc(clamp(48px, ${lines}rem + 1.5rem, 240px) + 2rem)`;
}
