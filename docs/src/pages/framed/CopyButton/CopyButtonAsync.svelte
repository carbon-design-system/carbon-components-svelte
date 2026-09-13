<script>
  import { CopyButton } from "carbon-components-svelte";

  const content = "api_9f2b41c9d8e34a1b8c6f2e0a1d9b3c47";
  let cachedContent = null;

  async function prefetchContent() {
    if (cachedContent) return;

    await new Promise((resolve) => setTimeout(resolve, 300));
    cachedContent = content;
  }

  async function copyContent() {
    if (!cachedContent) {
      await prefetchContent();
    }

    await navigator.clipboard.writeText(cachedContent);
  }
</script>

<CopyButton
  iconDescription="Copy fetched content"
  feedback="Copied!"
  copy={copyContent}
  on:mouseenter={prefetchContent}
  on:copy:error={(e) => {
    console.error("Copy failed", e.detail.error);
  }}
/>
