<script lang="ts">
  import Kbd from "carbon-components-svelte/Kbd/Kbd.svelte";

  export let shortcut = "ctrl+k";
  export let locale: "de" | "fr" = "de";

  const german = (id: string) =>
    ({ ctrl: "Strg", shift: "Umschalt" })[id] ?? id;
  const french = (id: string) => ({ ctrl: "Ctrl", shift: "Maj" })[id] ?? id;
</script>

<Kbd data-testid="apple" shortcut="mod+shift+p" apple />
<Kbd data-testid="other" shortcut="mod+shift+p" apple={false} />
<Kbd data-testid="escape" shortcut="esc" apple={false} />
<Kbd data-testid="slot">Fn</Kbd>
<Kbd data-testid="sm" shortcut="mod+k" size="sm" />
<Kbd data-testid="muted" shortcut="mod+k" variant="muted" apple />
<Kbd data-testid="invalid" shortcut="hyper+k">Fallback</Kbd>
<Kbd
  data-testid="german"
  shortcut="mod+shift+s"
  apple={false}
  translateWithId={german}
/>
<Kbd
  data-testid="dynamic"
  {shortcut}
  apple={false}
  translateWithId={locale === "de" ? german : french}
/>
