<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    text: `Ticket #${10000 + i}`,
  }));

  let selectedId = 42;
</script>

<Dropdown labelText="Support ticket" {items} bind:selectedId />
