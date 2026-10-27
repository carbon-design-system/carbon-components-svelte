<script>
  import { KeyboardShortcut } from "carbon-components-svelte";
</script>

<!-- Rendered on the server by e2e/keyboard-shortcut-hydration.test.ts, and hydrated here. -->
<p data-testid="plain">
  Palette <KeyboardShortcut shortcut="mod+shift+p" />
</p>
<p data-testid="muted">
  Palette <KeyboardShortcut shortcut="mod+shift+p" variant="muted" decorative />
</p>
<p data-testid="forced">
  Palette <KeyboardShortcut shortcut="mod+shift+p" apple />
</p>
