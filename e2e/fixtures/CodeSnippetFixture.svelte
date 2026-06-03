<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import CheckmarkIcon from "./CheckmarkIcon.svelte";

  const shortCode = "const x = 1;";
  const longCode = Array(20)
    .fill("function example() { return 'line'; }")
    .join("\n");
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
