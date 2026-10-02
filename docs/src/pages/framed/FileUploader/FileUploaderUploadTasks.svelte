<script>
  import {
    Button,
    createUploadTasks,
    FileUploader,
  } from "carbon-components-svelte";

  let files = [];

  const queue = createUploadTasks((file, { signal, onProgress }) => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.2;
        onProgress(Math.min(progress, 1));
        if (progress >= 1) {
          clearInterval(interval);
          if (file.name.includes("fail")) {
            reject(new Error("Simulated upload failure"));
          } else {
            resolve();
          }
        }
      }, 400);

      signal.addEventListener("abort", () => {
        clearInterval(interval);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  });

  const { tasks } = queue;

  $: queue.sync(files);

  // FileUploader only re-resolves a row's fileStatus/fileInvalid/etc. when
  // `files` changes identity. Reassign it whenever a task updates so
  // progress, completion, and errors stay current.
  $: if ($tasks) {
    files = [...files];
  }

  $: failed = files.filter((file) => queue.fileInvalid(file));
</script>

<p>
  Remove a row to abort its upload. Name a file with "fail" to see the error
  path, then use its retry button below.
</p>

<FileUploader
  multiple
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription='Files named with "fail" simulate an upload error.'
  bind:files
  fileStatus={queue.fileStatus}
  fileInvalid={queue.fileInvalid}
  fileErrorSubject={queue.fileErrorSubject}
  fileErrorBody={queue.fileErrorBody}
/>

{#each failed as file (file)}
  <Button size="small" kind="tertiary" on:click={() => queue.retry(file)}>
    Retry {file.name}
  </Button>
{/each}
