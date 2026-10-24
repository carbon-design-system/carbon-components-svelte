<script>
  import {
    Button,
    ButtonSet,
    NotificationQueue,
  } from "carbon-components-svelte";

  let queue;
</script>

<NotificationQueue bind:this={queue} />

<ButtonSet>
  <Button
    on:click={() => {
      queue.add({
        kind: "success",
        title: "Report deleted",
        subtitle: "Q3 revenue summary moved to trash.",
        action: {
          label: "Undo",
          onClick: () => {
            queue.add({
              kind: "info",
              title: "Report restored",
              subtitle: "Q3 revenue summary is back in Reports.",
              timeout: 3000,
            });
          },
        },
      });
    }}
  >
    Delete report
  </Button>
  <Button
    kind="tertiary"
    on:click={() => {
      const id = queue.add({
        kind: "error",
        title: "Upload failed",
        subtitle:
          "The connection timed out before quarterly-report.pdf finished.",
        action: {
          label: "Retry",
          onClick: (event) => {
            // Keep the toast open and show progress in place.
            event.preventDefault();
            queue.update(id, {
              kind: "info",
              title: "Retrying upload",
              subtitle: "Uploading quarterly-report.pdf.",
              action: undefined,
              hideCloseButton: true,
            });
            setTimeout(() => {
              queue.update(id, {
                kind: "success",
                title: "Upload complete",
                subtitle: "quarterly-report.pdf is in Reports.",
                hideCloseButton: false,
                timeout: 3000,
              });
            }, 1500);
          },
        },
      });
    }}
  >
    Upload file
  </Button>
</ButtonSet>
