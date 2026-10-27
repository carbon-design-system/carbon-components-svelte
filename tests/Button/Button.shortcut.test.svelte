<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let preventShortcut = false;
  export let disabled = false;

  let clicks = 0;
  let shortcuts = 0;
</script>

<Button
  data-testid="save"
  shortcut="ctrl+s"
  {disabled}
  on:click={() => clicks++}
  on:shortcut={(e) => {
    shortcuts++;
    if (preventShortcut) e.preventDefault();
  }}
>
  Save
</Button>
<Button
  data-testid="icon-only"
  icon={Add}
  iconDescription="Add"
  shortcut="ctrl+shift+a"
/>
<Button data-testid="with-icon" icon={Add} shortcut="ctrl+e">Export</Button>
<span data-testid="clicks">{clicks}</span>
<span data-testid="shortcuts">{shortcuts}</span>
<Button data-testid="loading" shortcut="ctrl+l" loading>Publish</Button>
<Button data-testid="loading-icon" shortcut="ctrl+i" icon={Add} loading>
  Upload
</Button>
