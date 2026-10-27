<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;

  function save(fails) {
    const request = new Promise((resolve, reject) => {
      setTimeout(
        () => (fails ? reject(new Error("offline")) : resolve({ rows: 12 })),
        1500,
      );
    });

    queue
      .promise(request, {
        loading: "Saving changes...",
        success: (result) => ({
          title: "Changes saved",
          subtitle: `${result.rows} rows updated.`,
        }),
        error: (reason) => ({
          title: "Changes not saved",
          subtitle: `The request failed: ${reason.message}.`,
        }),
      })
      // `promise` returns the promise it was given, so it still rejects.
      .catch(() => {});
  }
</script>

<NotificationQueue bind:this={queue} />

<ButtonSet>
  <Button on:click={() => save(false)}>Save</Button>
  <Button kind="tertiary" on:click={() => save(true)}>Save and fail</Button>
</ButtonSet>
