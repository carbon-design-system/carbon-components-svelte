<script lang="ts">
  import { TooltipDefinition } from "../types";

  let open = false;
</script>

<TooltipDefinition
  bind:open
  on:open
  on:close
  tooltipText="IBM Corporate Headquarters is based in Armonk, New York."
>
  Armonk
</TooltipDefinition>

<TooltipDefinition
  direction="top"
  align="start"
  tooltipText="IBM Corporate Headquarters is based in Armonk, New York."
>
  Armonk
</TooltipDefinition>

<TooltipDefinition>
  Armonk
  <span slot="tooltip" style="color: red">
    IBM Corporate Headquarters is based in Armonk, New York.
  </span>
</TooltipDefinition>
