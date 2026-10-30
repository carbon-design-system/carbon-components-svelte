<script lang="ts">
  import Gantt from "carbon-components-svelte/Gantt/Gantt.svelte";

  export let today: string | undefined = undefined;
</script>

<Gantt
  labelText="Plan"
  {today}
  expandedIds={["plan"]}
  tasks={[
    {
      id: "plan",
      text: "Planning",
      nodes: [
        { id: "a", text: "A", start: "2026-03-02", end: "2026-03-06" },
        { id: "b", text: "B", start: "2026-03-09", milestone: true },
      ],
    },
  ]}
  links={[{ from: "a", to: "b" }]}
/>
