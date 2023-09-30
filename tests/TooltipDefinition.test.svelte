<script lang="ts">
  import { TooltipDefinition } from "../types";

  let open = false;
</script>

<TooltipDefinition
  bind:open
  on:open
  on:close
  definition="IBM Corporate Headquarters is based in Armonk, New York."
>
  Armonk
</TooltipDefinition>

<TooltipDefinition
  align="top"
  definition="IBM Corporate Headquarters is based in Armonk, New York."
>
  Armonk
</TooltipDefinition>

<TooltipDefinition>
  Armonk
  <span slot="definition" style="color: red">
    IBM Corporate Headquarters is based in Armonk, New York.
  </span>
</TooltipDefinition>
