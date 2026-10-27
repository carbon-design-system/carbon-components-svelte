<script lang="ts">
  import Kbd from "carbon-components-svelte/Kbd/Kbd.svelte";
  import { setKbdTranslations } from "carbon-components-svelte/Kbd/kbd-translations.js";

  setKbdTranslations({ ctrl: "Strg", shift: "Umschalt" });
</script>

<Kbd data-testid="shared" shortcut="mod+shift+enter" apple={false} />
<Kbd
  data-testid="own"
  shortcut="mod+k"
  apple={false}
  translateWithId={(id) => (id === "ctrl" ? "Control" : id)}
/>
