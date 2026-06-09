<script lang="ts">
  import HeaderAction from "carbon-components-svelte/UIShell/HeaderAction.svelte";
</script>

<HeaderAction text="Default text">
  <span slot="textChildren">Custom text content</span>
  <div slot="icon" data-testid="custom-icon">🔍</div>
</HeaderAction>
