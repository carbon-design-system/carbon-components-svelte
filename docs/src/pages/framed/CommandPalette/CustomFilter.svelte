<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
  } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  let open = false;

  const prefixMatch = (text, query) => {
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

<CommandPalette
  bind:open
  match={prefixMatch}
  triggerKeys={[]}
  placeholder="Type a prefix..."
>
  <CommandPaletteItem id="docs" text="Documents" icon={Document} />
  <CommandPaletteItem id="draft" text="Drafts folder" icon={Folder} />
  <CommandPaletteItem id="archive" text="Archive" icon={Folder} />
</CommandPalette>
