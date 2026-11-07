<script>
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import AILabelActions from "carbon-components-svelte/AILabel/AILabelActions.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import Tile from "carbon-components-svelte/Tile/Tile.svelte";
</script>

<AILabel open>
  <p>Generated from the last 90 days of usage.</p>
  <AILabelActions>
    <Button>View details</Button>
  </AILabelActions>
</AILabel>
<AILabel variant="inline" size="md" labelText="Generated summary" />
<TextInput labelText="Incident title">
  <AILabel slot="decorator" />
</TextInput>
<Tag type="blue">Forecast<AILabel slot="decorator" /></Tag>
<Tile>Usage forecast<AILabel slot="decorator" /></Tile>
