<script lang="ts">
  import ShortcutHelp from "carbon-components-svelte/ShortcutProvider/ShortcutHelp.svelte";
  import ShortcutProvider from "carbon-components-svelte/ShortcutProvider/ShortcutProvider.svelte";
</script>

<ShortcutProvider>
  <ShortcutHelp open {...$$restProps} />
</ShortcutProvider>
