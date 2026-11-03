<script lang="ts">
  import { setKbdTranslations } from "carbon-components-svelte/Kbd/kbd-translations.js";
  import Search from "carbon-components-svelte/Search/Search.svelte";

  setKbdTranslations({ ctrl: "Strg", shift: "Umschalt" });
</script>

<div data-testid="translated">
  <Search shortcut="ctrl+shift+f" />
</div>
