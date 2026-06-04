<script>
  import { CopyButton } from "carbon-components-svelte";

  const content = "Text fetched on demand";
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
