<script>
  import { onMount } from "svelte";
  import { ProgressBar } from "carbon-components-svelte";

  let max = 328;
  let value = 0;
  let timer = undefined;

  onMount(() => {
    timer = setTimeout(() => {
      const interval = setInterval(() => {
        const delta = Math.random() * 10;

        if (value + delta < max) {
          value += delta;
        } else {
          value = max;
          clearInterval(interval);
        }
      }, 20);
    }, 2000);

    return () => clearTimeout(timer);
  });

  $: helperText =
    value > 0 ? `${value.toFixed(0)}MB of ${max}MB` : "Preparing upload...";
  $: if (value === max) helperText = "Done";
</script>

<ProgressBar
  labelText="Upload status"
  value="{value}"
  max="{max}"
  helperText="{helperText}"
/>
