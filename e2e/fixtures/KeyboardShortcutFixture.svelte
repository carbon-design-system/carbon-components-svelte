<script>
  import { Button, KeyboardShortcut, Tooltip } from "carbon-components-svelte";

  // `?dir=rtl` sets the page direction before anything mounts.
  if (new URLSearchParams(location.search).get("dir") === "rtl") {
    document.documentElement.dir = "rtl";
  }
</script>

<main>
  <p data-testid="apple">
    Palette <KeyboardShortcut shortcut="mod+shift+p" apple />
  </p>
  <p data-testid="other">
    Palette <KeyboardShortcut shortcut="mod+shift+p" apple={false} />
  </p>
  <p data-testid="muted">
    Palette <KeyboardShortcut
      shortcut="mod+shift+p"
      variant="muted"
      apple={false}
    />
  </p>
  <p data-testid="decorative">
    Palette <KeyboardShortcut shortcut="mod+shift+p" apple decorative />
  </p>
  <Button data-testid="button">
    Search <KeyboardShortcut shortcut="mod+k" size="sm" decorative apple />
  </Button>
  <Tooltip open triggerText="Save" tooltipId="save-tooltip">
    <p data-testid="tooltip">
      Save changes <KeyboardShortcut
        shortcut="mod+s"
        size="sm"
        variant="muted"
      />
    </p>
  </Tooltip>
</main>
