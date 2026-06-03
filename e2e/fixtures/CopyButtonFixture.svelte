<script>
  import { CopyButton } from "carbon-components-svelte";
  import CheckmarkIcon from "./CheckmarkIcon.svelte";

  let copiedText = null;
</script>

<CopyButton
  data-testid="copy-button"
  text="Hello, World!"
  iconDescription="Copy to clipboard"
  feedback="Copied!"
  copy={(text) => {
    copiedText = text;
  }}
/>
{#if copiedText}
  <p data-testid="copied-value">Copied: {copiedText}</p>
{/if}

<CopyButton
  data-testid="copy-button-feedback-icon"
  text="Hello, World!"
  iconDescription="Copy with feedback icon"
  feedback="Copied with icon!"
  feedbackIcon={CheckmarkIcon}
  feedbackTimeout={500}
  copy={() => {}}
/>
