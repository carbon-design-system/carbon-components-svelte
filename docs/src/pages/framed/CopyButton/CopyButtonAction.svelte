<script>
  import { Button, copy, copyText, Stack, Tag } from "carbon-components-svelte";

  let basicLabel = "Copy endpoint";

  function handleBasicStateChange(state) {
    if (state === "copied") {
      basicLabel = "Copied!";
    } else if (state === "error") {
      basicLabel = "Failed to copy";
    } else if (state === "idle") {
      basicLabel = "Copy endpoint";
    }
  }

  let deferredLabel = "Copy token";

  async function getToken() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return "tok_9f2b41c9d8e34a1b8c6f2e0a1d9b3c47";
  }

  function handleDeferredStateChange(state) {
    if (state === "pending") {
      deferredLabel = "Fetching…";
    } else if (state === "copied") {
      deferredLabel = "Copied!";
    } else if (state === "idle") {
      deferredLabel = "Copy token";
    }
  }

  let tagText = "";
  let tagType = "gray";

  async function copyManually() {
    try {
      await copyText("https://api.acme.io/v1/status");
      tagText = "Copied";
      tagType = "green";
    } catch {
      tagText = "Failed";
      tagType = "red";
    }
  }
</script>

<Stack gap={5}>
  <button
    type="button"
    class="bx--btn bx--btn--tertiary bx--btn--sm"
    use:copy={{ text: "https://api.acme.io/v1", onStateChange: handleBasicStateChange }}
  >
    {basicLabel}
  </button>

  <button
    type="button"
    class="bx--btn bx--btn--tertiary bx--btn--sm"
    use:copy={{ getText: getToken, onStateChange: handleDeferredStateChange }}
  >
    {deferredLabel}
  </button>

  <Stack orientation="horizontal" gap={4} style="align-items: center;">
    <Button size="sm" on:click={copyManually}>Copy status URL</Button>
    {#if tagText}
      <Tag type={tagType}>{tagText}</Tag>
    {/if}
  </Stack>
</Stack>
