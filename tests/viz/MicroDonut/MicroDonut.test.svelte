<script lang="ts">
  import MicroDonut from "carbon-components-svelte/viz/MicroDonut/MicroDonut.svelte";

  export let data = [
    { id: "team", label: "Team", value: 45 },
    { id: "ent", label: "Enterprise", value: 38 },
    { id: "free", label: "Free", value: 17 },
  ];
  const many = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i}`,
    label: `Part ${i + 1}`,
    value: 8 - i,
  }));
</script>

<MicroDonut {data} label="Plan mix" data-testid="basic" />
<MicroDonut {data} data-testid="decorative" />
<MicroDonut {data} size="lg" label="With center" data-testid="center" let:total>
  {total}
</MicroDonut>
<MicroDonut
  data={many}
  diameter={64}
  thickness={8}
  label="Many"
  data-testid="many"
/>
<MicroDonut
  data={[
    { id: "a", label: "A", value: 1, color: "success" },
    { id: "b", label: "B", value: 0 },
  ]}
  label="One"
  data-testid="single"
/>
<MicroDonut data={[]} label="Empty" data-testid="empty" />
