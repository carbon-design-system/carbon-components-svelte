<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import CheckmarkIcon from "./CheckmarkIcon.svelte";

  const shortCode = "const x = 1;";
  const longCode = Array(20)
    .fill("function example() { return 'line'; }")
    .join("\n");
  // 14 lines: at the 16px code-01 line-height this is 224px of text, under the
  // 240px collapsed viewport, so no content is hidden and the expand button
  // must stay hidden even though the <pre>'s bottom padding pushes its raw
  // bounding-box height past the threshold.
  const boundaryCode = Array.from(
    { length: 14 },
    (_, i) => `const line${i + 1} = ${i + 1};`,
  ).join("\n");

  let dynamicExpanded = false;
  $: dynamicLines = dynamicExpanded ? 24 : 3;
  $: dynamicCode = Array.from(
    { length: dynamicLines },
    (_, i) => `const line${i + 1} = ${i + 1};`,
  ).join("\n");
</script>

<div data-testid="single-snippet">
  <CodeSnippet type="single" code={shortCode} data-testid="snippet-single" />
</div>

<div data-testid="multi-snippet">
  <CodeSnippet
    type="multi"
    code={longCode}
    data-testid="snippet-multi"
    showMoreText="Show more"
    showLessText="Show less"
  />
</div>

<div data-testid="short-multi-snippet">
  <CodeSnippet
    type="multi"
    code={shortCode}
    data-testid="snippet-multi-short"
  />
</div>

<div data-testid="boundary-multi-snippet">
  <CodeSnippet
    type="multi"
    code={boundaryCode}
    data-testid="snippet-multi-boundary"
  />
</div>

<div data-testid="dynamic-multi-snippet">
  <button
    type="button"
    data-testid="toggle-content-size"
    on:click={() => (dynamicExpanded = !dynamicExpanded)}
  >
    Toggle content size
  </button>
  <CodeSnippet
    type="multi"
    code={dynamicCode}
    data-testid="snippet-multi-dynamic"
  />
</div>

<div data-testid="feedback-icon-snippet">
  <CodeSnippet
    type="single"
    code={shortCode}
    data-testid="snippet-feedback-icon"
    copyButtonDescription="Copy with feedback icon"
    feedbackIcon={CheckmarkIcon}
    feedbackTimeout={500}
    copy={() => {}}
  />
</div>
