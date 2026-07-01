<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";

  let open = false;

  // Contiguous-substring matcher: scattered subsequences like "dt" no longer match.
  const contiguousMatch = (text, query) => {
    const q = query.trim().toLowerCase();
    if (q === "") return { matched: true, indices: [] };
    const lower = text.toLowerCase();
    const start = lower.indexOf(q);
    if (start === -1) return { matched: false, indices: [] };
    return {
      matched: true,
      indices: Array.from({ length: q.length }, (_, i) => start + i),
    };
  };
</script>

<Button on:click={() => (open = true)}>Open palette</Button>

<p style="margin-top: var(--cds-spacing-05)">
  Try searching for <strong>dt</strong> — only contiguous matches are shown.
</p>

<CommandPalette bind:open match={contiguousMatch} triggerKeys={[]}>
  <CommandPaletteItem id="1" text="Data Table" />
  <CommandPaletteItem id="2" text="Data Store for Memcache" />
  <CommandPaletteItem id="3" text="Databases for TestSQL" />
</CommandPalette>
