<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  let emailEnabled = false;
  let smsEnabled = false;
  let saved = true;

  function toggle(setter) {
    return (e) => {
      // Keep the menu open while editing settings.
      e.preventDefault();
      setter();
      saved = false;
    };
  }
</script>

<OverflowMenu
  on:close={(e) => {
    // Guard against accidentally dismissing unsaved changes.
    if (!saved && !window.confirm("Discard unsaved notification settings?")) {
      e.preventDefault();
    }
  }}
>
  <OverflowMenuItem
    text="Email alerts: {emailEnabled ? 'On' : 'Off'}"
    on:click={toggle(() => (emailEnabled = !emailEnabled))}
  />
  <OverflowMenuItem
    text="SMS alerts: {smsEnabled ? 'On' : 'Off'}"
    on:click={toggle(() => (smsEnabled = !smsEnabled))}
  />
  <OverflowMenuItem
    hasDivider
    text="Save changes"
    on:click={() => {
      // Allow the menu to close after saving.
      saved = true;
    }}
  />
</OverflowMenu>
