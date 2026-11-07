<script>
  import { Button, Masonry, Stack, Text, Tile } from "carbon-components-svelte";

  let nextId = 7;
  let notes = [
    {
      id: 1,
      title: "Rotate the staging certificates",
      body: "Expire on the 14th. Renew through the internal CA and restart the ingress pods once the new secret is mounted.",
    },
    { id: 2, title: "Standup", body: "Moved to 9:30 on Thursdays." },
    {
      id: 3,
      title: "Capacity review",
      body: "Object storage grew 12% last quarter. Compare against the forecast before the planning meeting, and flag the two regions that are over 80% full. Ask finance whether the reserved-capacity discount covers the new zone.",
    },
    { id: 4, title: "On call", body: "Hand off to Priya on Monday." },
    {
      id: 5,
      title: "Postmortem follow-ups",
      body: "Add an alert for queue depth. Document the failover runbook. Remove the manual step from the deploy checklist.",
    },
    {
      id: 6,
      title: "Reading list",
      body: "Notes on consistency models, and the paper on log-structured storage.",
    },
  ];

  function addNote() {
    notes = [
      {
        id: nextId,
        title: `Note ${nextId}`,
        body: "A new note goes first and the rest repack around it.",
      },
      ...notes,
    ];
    nextId += 1;
  }
</script>

<Stack gap={5}>
  <Stack orientation="horizontal">
    <Button size="small" on:click={addNote}>Add note</Button>
  </Stack>
  <Masonry columnWidth="15rem">
    {#each notes as note (note.id)}
      <Tile>
        <Stack gap={3}>
          <Text type="heading-compact-01">{note.title}</Text>
          <Text type="body-compact-01">{note.body}</Text>
        </Stack>
      </Tile>
    {/each}
  </Masonry>
</Stack>
