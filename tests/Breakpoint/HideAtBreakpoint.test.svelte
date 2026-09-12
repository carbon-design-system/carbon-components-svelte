<script lang="ts">
  import type { HideAtBreakpointOptions } from "carbon-components-svelte/Breakpoint/hide-at-breakpoint";
  import { hideAtBreakpoint } from "carbon-components-svelte/Breakpoint/hide-at-breakpoint";

  export let options: HideAtBreakpointOptions = {};
</script>

<div data-testid="target" use:hideAtBreakpoint={options}>Content</div>
