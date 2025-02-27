<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";
</script>

<ContentSwitcher>
  <Switch text="Enabled" />
  <Switch text="Disabled" disabled />
  <Switch text="Also Enabled" />
</ContentSwitcher>
