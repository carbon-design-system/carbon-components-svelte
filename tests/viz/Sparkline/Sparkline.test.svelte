<script lang="ts">
  import Sparkline from "carbon-components-svelte/viz/Sparkline/Sparkline.svelte";

  const values = [1, 5, 3, 8, 2, 9, 4];
</script>

<Sparkline {values} label="Requests per minute" data-testid="labelled" />

<Sparkline {values} data-testid="unlabelled" />

<Sparkline {values} kind="line" data-testid="line" />

<Sparkline {values} kind="line" fill data-testid="line-fill" />

<Sparkline {values} kind="bar" data-testid="bar" />

<Sparkline {values} color="error" data-testid="error-color" />

<Sparkline values={[]} data-testid="empty" />

<Sparkline {values} color={3} data-testid="categorical" />

<Sparkline {values} color="rebeccapurple" data-testid="custom-color" />

<Sparkline
  values={[1, 5, null, 8, 2]}
  kind="line"
  fill
  data-testid="gap-line"
/>

<Sparkline values={[1, 5, Number.NaN, 8, 2]} kind="bar" data-testid="gap-bar" />

<Sparkline values={[7]} kind="line" data-testid="single" />
