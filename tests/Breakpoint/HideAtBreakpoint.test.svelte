<script lang="ts">
  import type { HideAtBreakpointOptions } from "carbon-components-svelte/Breakpoint/hideAtBreakpoint";
  import { hideAtBreakpoint } from "carbon-components-svelte/Breakpoint/hideAtBreakpoint";

  export let options: HideAtBreakpointOptions = {};
</script>

<div data-testid="target" use:hideAtBreakpoint={options}>Content</div>
