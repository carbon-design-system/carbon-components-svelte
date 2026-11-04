<script>
  import { TextInput, Theme, Tile } from "carbon-components-svelte";

  const tokens = {
    "layer-01": "rgb(255, 0, 0)",
    "field-01": "rgb(0, 128, 0)",
  };
</script>

<Theme theme="white" {tokens} />

<Tile data-testid="tile">Tile</Tile>
<TextInput labelText="Field" />
