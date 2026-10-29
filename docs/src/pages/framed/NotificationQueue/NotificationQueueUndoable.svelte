<script>
  import { Button, NotificationQueue } from "carbon-components-svelte";

  let queue;
  let messages = ["Welcome", "Invoice 1042", "Team lunch"];
  let log = "";

  function remove(message) {
    messages = messages.filter((item) => item !== message);

    queue
      .undoable({
        title: "Message deleted",
        subtitle: message,
        // Runs once the toast leaves without Undo.
        commit: () => {
          log = `Deleted "${message}" on the server.`;
        },
        // Runs when the user chooses Undo.
        undo: () => {
          messages = [...messages, message];
        },
      })
      .then((committed) => {
        if (!committed) log = `Kept "${message}".`;
      });
  }
</script>

<NotificationQueue bind:this={queue} />

<ul>
  {#each messages as message (message)}
    <li>
      {message}
      <Button size="small" kind="ghost" on:click={() => remove(message)}>
        Delete
      </Button>
    </li>
  {/each}
</ul>
<p>{log}</p>
