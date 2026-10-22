<script lang="ts">
  import Divider from "carbon-components-svelte/Divider/Divider.svelte";
</script>

<Divider data-testid="default" />
<Divider data-testid="vertical" orientation="vertical" />
<Divider data-testid="decorative" decorative />
<Divider data-testid="margin-scale" margin={5} />
<Divider data-testid="margin-custom" margin="2rem" />
<Divider
  data-testid="vertical-margin-scale"
  orientation="vertical"
  margin={5}
/>
<Divider
  data-testid="vertical-margin-custom"
  orientation="vertical"
  margin="2rem"
/>
<Divider data-testid="decorative-vertical" orientation="vertical" decorative />
