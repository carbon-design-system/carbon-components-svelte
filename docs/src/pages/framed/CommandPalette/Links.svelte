<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";

  let open = false;
  let lastHref = "";

  function navigate(href) {
    lastHref = href;
    open = false;
  }
</script>

<Button on:click={() => (open = true)}>Open palette</Button>

{#if lastHref}
  <p style="margin-top: var(--cds-spacing-05)">
    Navigated to: <code>{lastHref}</code>
  </p>
{/if}

<CommandPalette bind:open {navigate} triggerKeys={[]}>
  <CommandPaletteItem id="home" text="Home" href="/" icon={Home} />
  <CommandPaletteItem
    id="docs"
    text="Documentation"
    href="/components/CommandPalette"
    icon={Document}
  />
</CommandPalette>
