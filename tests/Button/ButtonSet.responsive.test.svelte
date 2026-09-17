<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ButtonSet from "carbon-components-svelte/Button/ButtonSet.svelte";
</script>

<ButtonSet>
  <Button>scalar-default</Button>
</ButtonSet>

<ButtonSet stacked>
  <Button>scalar-stacked</Button>
</ButtonSet>

<ButtonSet stacked={{ sm: true, lg: false }}>
  <Button>object-stacked</Button>
</ButtonSet>
