<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlightCode } from "carbon-components-svelte/syntax";
  import "carbon-components-svelte/css/syntax-tokens.css";
  import "carbon-components-svelte/css/syntax.css";

  const code = `import { Button } from "carbon-components-svelte";

export function save(items) {
  const total = items.length;
  // a very long line to scroll sideways: ${"x".repeat(120)}
  return total > 0 ? total : null;
}
`;
  const diff = ` function save(items) {
-  const total = items.length;
+  const total = items.filter(Boolean).length;
   return total;
 }`;
  const rows = (count) =>
    Array.from(
      { length: count },
      (_, i) => `const line${i + 1} = ${i + 1};`,
    ).join("\n");

  let bigShown = false;
</script>

<div data-testid="lines">
  <CodeSnippet
    type="multi"
    {code}
    lineNumbers
    highlightLines="3,5-6"
    data-testid="snippet-lines"
  />
</div>

<div data-testid="lines-wrapped">
  <CodeSnippet
    type="multi"
    {code}
    lineNumbers
    wrapText
    lineNumberStart={98}
    highlightLines="5"
    data-testid="snippet-lines-wrapped"
  />
</div>

<div data-testid="diff">
  <CodeSnippet
    type="multi"
    code={diff}
    diff
    lineNumbers
    data-testid="snippet-diff"
  />
</div>

<div data-testid="diff-result">
  <CodeSnippet
    type="multi"
    code={diff}
    diff
    diffCopy="result"
    data-testid="snippet-diff-result"
  />
</div>

<div data-testid="rows-15-plain">
  <CodeSnippet
    type="multi"
    code={rows(15)}
    data-testid="snippet-rows-15-plain"
  />
</div>

<div data-testid="rows-15">
  <CodeSnippet
    type="multi"
    code={rows(15)}
    lineNumbers
    highlightLines="2"
    data-testid="snippet-rows-15"
  />
</div>

<div data-testid="rows-16">
  <CodeSnippet
    type="multi"
    code={rows(16)}
    lineNumbers
    data-testid="snippet-rows-16"
  />
</div>

<div data-testid="syntax" use:highlightCode={"ts"}>
  <CodeSnippet
    type="multi"
    code={`const a = 1; // done\nconst b = "two";\n`}
    lineNumbers
    highlightLines="2"
    data-testid="snippet-syntax"
  />
</div>

<div data-testid="big">
  <button
    type="button"
    data-testid="show-big"
    on:click={() => (bigShown = true)}
  >
    Show 5,000 lines
  </button>
  {#if bigShown}
    <CodeSnippet
      type="multi"
      code={rows(5000)}
      lineNumbers
      highlightLines="2-4,4990"
      data-testid="snippet-big"
    />
  {/if}
</div>
