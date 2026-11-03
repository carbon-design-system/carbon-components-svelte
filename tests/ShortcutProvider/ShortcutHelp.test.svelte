<script lang="ts">
  import ShortcutHelp from "carbon-components-svelte/ShortcutProvider/ShortcutHelp.svelte";
  import ShortcutProvider from "carbon-components-svelte/ShortcutProvider/ShortcutProvider.svelte";
  import { shortcut } from "carbon-components-svelte/ShortcutProvider/shortcut.js";

  export let open = false;
  export let helpKeys = "?";
  export let scoped = false;
  export let disabled = false;
</script>

<ShortcutProvider>
  <ShortcutHelp bind:open shortcut={helpKeys} />
  <input data-testid="field" aria-label="Name" />
  <button
    type="button"
    {disabled}
    use:shortcut={{
      keys: "mod+k",
      label: "Open command palette",
      onTrigger: () => {},
    }}>Search</button
  >
  <div
    use:shortcut={{
      keys: "mod+s",
      label: "Save draft",
      onTrigger: () => {},
    }}
  >
    <button type="button">Save</button>
  </div>
  {#if scoped}
    <ShortcutProvider titleText="Edit profile">
      <div
        use:shortcut={{
          keys: "mod+s",
          label: "Save profile",
          onTrigger: () => {},
        }}
      >
        <button type="button">Save profile</button>
      </div>
    </ShortcutProvider>
  {/if}
</ShortcutProvider>
