<script>
  import { getNotificationQueue } from "carbon-components-svelte";

  export let lowContrast = false;

  const queue = getNotificationQueue();

  let committed = [];

  function save(fail) {
    const task = new Promise((resolve, reject) =>
      setTimeout(() => (fail ? reject(new Error("offline")) : resolve()), 1500),
    );
    queue
      .promise(task, {
        loading: { title: "Saving...", lowContrast },
        success: { title: "Saved", lowContrast },
        error: {
          title: "Not saved",
          subtitle: "You are offline.",
          lowContrast,
        },
      })
      .catch(() => {});
  }

  function remove() {
    queue
      .undoable({
        title: "Message deleted",
        lowContrast,
        commit: () => {
          committed = [...committed, "deleted"];
        },
      })
      .then((done) => {
        if (!done) committed = [...committed, "restored"];
      });
  }
</script>

<button type="button" data-testid="save" on:click={() => save(false)}>
  Save
</button>
<button type="button" data-testid="fail" on:click={() => save(true)}>
  Fail
</button>
<button type="button" data-testid="remove" on:click={remove}>Delete</button>
<p data-testid="committed">{committed.join(",")}</p>
