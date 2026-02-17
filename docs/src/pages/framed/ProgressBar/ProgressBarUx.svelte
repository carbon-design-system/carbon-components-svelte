<script>
  import { Button, ButtonSet, ProgressBar } from "carbon-components-svelte";

  let max = 328;
  let value = 0;
  let status = "active";

  $: helperText =
    value > 0 ? `${value.toFixed(0)}MB of ${max}MB` : "Press start";
  $: if (value === max) {
    helperText = "Done";
    status = "finished";
  }
</script>

<ProgressBar labelText="Upload status" {value} {max} {helperText} {status} />

<ButtonSet style="margin-top: var(--cds-spacing-08)">
  <Button
    disabled={value > 0}
    on:click={() => {
      const interval = setInterval(() => {
        const delta = Math.random() * 10;

        if (value + delta < max) {
          value += delta;
        } else {
          value = max;
          clearInterval(interval);
        }
      }, 30);
    }}
  >
    Start
  </Button>
  <Button
    kind="tertiary"
    disabled={value !== max}
    on:click={() => {
      value = 0;
      status = "active";
    }}
  >
    Reset
  </Button>
</ButtonSet>
