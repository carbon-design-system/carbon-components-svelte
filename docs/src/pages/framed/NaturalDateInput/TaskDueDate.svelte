<script>
  import {
    Button,
    formatNaturalDate,
    NaturalDateInput,
    Stack,
  } from "carbon-components-svelte";

  let due = null;
  let tasks = [
    {
      title: "Renew the TLS certificate for api.northwind.io",
      due: "Tomorrow",
    },
  ];

  function add() {
    tasks = [
      ...tasks,
      {
        title: "Review the incident postmortem",
        due: formatNaturalDate(due, { style: "short" }),
      },
    ];
    due = null;
  }
</script>

<Stack gap={6}>
  <NaturalDateInput
    labelText="Due date"
    helperText="Try tomorrow, next Fri or in 2 weeks"
    bind:value={due}
  />
  <Button disabled={!due} on:click={add}>Add task</Button>
  <ul>
    {#each tasks as task}
      <li>{task.title}: due {task.due}</li>
    {/each}
  </ul>
</Stack>
