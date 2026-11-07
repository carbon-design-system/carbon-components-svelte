<script>
  import { Button, focusHandoff, Stack } from "carbon-components-svelte";

  let steps = ["Build", "Test", "Deploy", "Verify"];

  function moveUp(step) {
    const i = steps.indexOf(step);
    if (i < 1) return;
    const next = steps.slice();
    next.splice(i - 1, 2, steps[i], steps[i - 1]);
    steps = next;
  }
</script>

<ol aria-label="Pipeline steps" use:focusHandoff={{ items: "li" }}>
  {#each steps as step (step)}
    <li>
      <Stack as orientation="horizontal" gap={3} let:props>
        <span {...props}>{step}</span>
        <Button size="small" kind="ghost" on:click={() => moveUp(step)}>
          Move {step} up
        </Button>
      </Stack>
    </li>
  {/each}
</ol>
