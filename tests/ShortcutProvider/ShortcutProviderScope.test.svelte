<script lang="ts">
  import ShortcutProvider from "carbon-components-svelte/ShortcutProvider/ShortcutProvider.svelte";
  import { shortcut } from "carbon-components-svelte/ShortcutProvider/shortcut.js";

  export let onTrigger: (name: string) => void = () => {};
  export let open = true;
  export let hidden = false;
</script>

<ShortcutProvider>
  <div
    use:shortcut={{
      keys: "mod+s",
      label: "Save draft",
      onTrigger: () => onTrigger("page save"),
    }}
  >
    <button type="button">Save</button>
  </div>
  <div
    use:shortcut={{
      keys: "mod+k",
      label: "Open command palette",
      onTrigger: () => onTrigger("palette"),
    }}
  >
    <button type="button">Search</button>
  </div>
  {#if open}
    <div data-testid="panel" {hidden}>
      <ShortcutProvider titleText="Edit profile">
        <div
          use:shortcut={{
            keys: "mod+s",
            label: "Save profile",
            onTrigger: () => onTrigger("panel save"),
          }}
        >
          <button type="button">Save profile</button>
        </div>
      </ShortcutProvider>
    </div>
  {/if}
</ShortcutProvider>
