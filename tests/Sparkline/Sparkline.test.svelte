<script lang="ts">
  import Sparkline from "carbon-components-svelte/Sparkline/Sparkline.svelte";

  const values = [1, 5, 3, 8, 2, 9, 4];
</script>

<Sparkline {values} label="Requests per minute" data-testid="labelled" />

<Sparkline {values} data-testid="unlabelled" />

<Sparkline {values} kind="line" data-testid="line" />

<Sparkline {values} kind="line" fill data-testid="line-fill" />

<Sparkline {values} kind="bar" data-testid="bar" />

<Sparkline {values} color="error" data-testid="error-color" />

<Sparkline values={[]} data-testid="empty" />
