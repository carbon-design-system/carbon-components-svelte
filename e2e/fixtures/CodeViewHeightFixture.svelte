<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { codeViewHeight } from "../../docs/src/code-view-height";

  // Around the 15-row cap, and a trailing newline, which renders no line.
  const counts = [1, 2, 5, 13, 14, 15, 16, 40];
  const codeOf = (lines) =>
    Array.from(
      { length: lines },
      (_, i) => `const line${i + 1} = ${i + 1};`,
    ).join("\n");
  const views = [
    ...counts.map((lines) => ({ id: `${lines}`, code: codeOf(lines) })),
    { id: "5-trailing-newline", code: `${codeOf(5)}\n` },
  ];
</script>

<!-- Each view's snippet, beside a probe the height the docs reserve for
     it; both are what's inside the docs' 1px border around a view. -->
{#each views as view (view.id)}
  <div data-testid="view-{view.id}">
    <CodeSnippet type="multi" code={view.code} />
  </div>
  <div
    data-testid="reserved-{view.id}"
    style:height={codeViewHeight(view.code)}
  ></div>
{/each}
