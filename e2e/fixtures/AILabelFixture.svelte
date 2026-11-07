<script>
  import {
    AILabel,
    AILabelActions,
    Button,
    Tag,
    TextInput,
    Tile,
    TooltipGroup,
  } from "carbon-components-svelte";
  import View from "carbon-icons-svelte/lib/View.svelte";
</script>

<div data-testid="default">
  <AILabel>
    <p>Generated from the last 90 days of usage.</p>
    <AILabelActions>
      <TooltipGroup>
        <Button
          kind="ghost"
          iconOnly
          icon={View}
          iconDescription="Show the source data"
        />
      </TooltipGroup>
      <Button>View details</Button>
    </AILabelActions>
  </AILabel>
</div>

<AILabel variant="inline" size="md" labelText="Generated summary">
  <p>Summarized from the incident timeline.</p>
</AILabel>

<TextInput labelText="Incident title" value="Database failover">
  <AILabel slot="decorator"><p>Suggested from the alert.</p></AILabel>
</TextInput>

<TextInput labelText="Region" value="us-east-1">
  <AILabel slot="decorator" edited><p>Detected from the host.</p></AILabel>
</TextInput>

<Tag type="blue"
  >Forecast<AILabel slot="decorator"><p>Generated from usage.</p></AILabel></Tag
>

<Tile>
  Usage forecast
  <AILabel slot="decorator"><p>Projected from spend.</p></AILabel>
</Tile>
