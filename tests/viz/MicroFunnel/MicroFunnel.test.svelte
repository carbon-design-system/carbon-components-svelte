<script lang="ts">
  import MicroFunnel from "carbon-components-svelte/viz/MicroFunnel/MicroFunnel.svelte";

  export let stages = [
    { id: "visit", label: "Visitors", value: 10000 },
    { id: "signup", label: "Signup", value: 6000 },
    { id: "paid", label: "Paid", value: 900 },
  ];
</script>

<MicroFunnel {stages} label="Signup funnel" data-testid="steps" />
<MicroFunnel {stages} data-testid="decorative" />
<MicroFunnel
  {stages}
  variant="completion"
  label="Signup funnel"
  data-testid="completion"
/>
<MicroFunnel
  {stages}
  variant="completion"
  hideValue
  data-testid="completion-bare"
/>
<MicroFunnel {stages} size="sm" color={3} data-testid="styled" />
<MicroFunnel {stages} color="success" data-testid="semantic" />
<MicroFunnel stages={[]} label="Empty funnel" data-testid="empty" />
