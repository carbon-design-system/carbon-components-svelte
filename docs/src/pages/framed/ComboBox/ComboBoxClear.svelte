<script>
  import { Button, ComboBox } from "carbon-components-svelte";

  let ref;
</script>

<ComboBox
  titleText="Contact"
  placeholder="Select contact method"
  selectedId="1"
  bind:this={ref}
  items={[
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ]}
/>
<br />
<Button on:click={ref.clear}>Clear</Button>
<Button on:click={() => ref.clear({ focus: false })}>Clear (no focus)</Button>
