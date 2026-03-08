<script>
  import { CopyButton } from "carbon-components-svelte";

  let copiedText = null;
</script>

<CopyButton
  data-testid="copy-button"
  text="Hello, World!"
  iconDescription="Copy to clipboard"
  feedback="Copied!"
  copy={async (text) => {
    copiedText = text;
  }}
/>
{#if copiedText}
  <p data-testid="copied-value">Copied: {copiedText}</p>
{/if}
