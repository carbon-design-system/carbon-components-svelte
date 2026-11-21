<script lang="ts">
  import ShortcutProvider from "carbon-components-svelte/ShortcutProvider/ShortcutProvider.svelte";
  import { shortcut } from "carbon-components-svelte/ShortcutProvider/shortcut.js";

  export let onTrigger: (name: string) => void = () => {};
  export let disabled = false;
  export let hidden = false;
  export let palette = "mod+k";
  export let shortcuts: {
    keys: string;
    label: string;
    onTrigger: () => void;
  }[] = [];
</script>

<ShortcutProvider {shortcuts}>
  <button
    type="button"
    data-testid="search"
    {disabled}
    use:shortcut={{
      keys: palette,
      label: "Open command palette",
      onTrigger: () => onTrigger("palette"),
    }}>Search</button
  >
  <button
    type="button"
    data-testid="delete"
    {hidden}
    use:shortcut={{
      keys: "d",
      label: "Delete row",
      onTrigger: () => onTrigger("delete"),
    }}>Delete</button
  >
  <input data-testid="field" aria-label="Name" />
  <div contenteditable="true" data-testid="editable"></div>
</ShortcutProvider>
