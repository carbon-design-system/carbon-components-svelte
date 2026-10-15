<script>
  import { TagInput } from "carbon-components-svelte";

  let value = ["Svelte", "TypeScript"];
</script>

<TagInput
  bind:value
  labelText="Topics"
  helperText="Press Enter or comma to add"
  placeholder="Add a topic"
/>
<div data-testid="value">{JSON.stringify(value)}</div>

<TagInput labelText="Read-only topics" readonly value={["Figma"]} />
<TagInput labelText="Disabled topics" disabled value={["Figma"]} />

<TagInput
  labelText="Recipients"
  value={["ada@example.com"]}
  invalid
  invalidText="Add at least two recipients"
/>
<TagInput
  labelText="External recipients"
  value={["ada@example.com"]}
  warn
  warnText="One recipient is outside your organization"
/>
