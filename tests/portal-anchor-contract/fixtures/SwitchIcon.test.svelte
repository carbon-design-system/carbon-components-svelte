<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import Calendar from "../../../src/icons/Calendar.svelte";
</script>

<ContentSwitcher>
  <Switch icon={Calendar} text="Calendar" />
</ContentSwitcher>
