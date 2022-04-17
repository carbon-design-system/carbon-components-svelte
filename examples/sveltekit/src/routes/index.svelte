<script>
  import { Button, truncate, breakpoints } from "carbon-components-svelte";
  import { Airplane } from "carbon-pictograms-svelte";
</script>

<Button>Primary button</Button>

<Airplane />

<div use:truncate>Text...</div>

{JSON.stringify(breakpoints)}
