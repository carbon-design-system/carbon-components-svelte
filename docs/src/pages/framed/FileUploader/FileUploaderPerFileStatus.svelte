<script>
  import { FileUploader } from "carbon-components-svelte";

  let files = [];
  let statusByKey = {};
  let timersByKey = {};

  function fileKey(file) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  function fileStatus(file) {
    return statusByKey[fileKey(file)] ?? "uploading";
  }

  function handleAdd(e) {
    e.detail.forEach((file, index) => {
      const key = fileKey(file);
      if (timersByKey[key]) clearTimeout(timersByKey[key]);
      statusByKey = { ...statusByKey, [key]: "uploading" };
      timersByKey[key] = setTimeout(
        () => {
          statusByKey = { ...statusByKey, [key]: "complete" };
          // fileStatus closes over statusByKey; reassign files so rows
          // re-resolve (callback identity alone does not invalidate).
          files = [...files];
          delete timersByKey[key];
        },
        700 + index * 500,
      );
    });
  }

  function handleRemove(e) {
    const next = { ...statusByKey };
    for (const file of e.detail) {
      const key = fileKey(file);
      if (timersByKey[key]) {
        clearTimeout(timersByKey[key]);
        delete timersByKey[key];
      }
      delete next[key];
    }
    statusByKey = next;
  }
</script>

<FileUploader
  multiple
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription="Each file completes on its own schedule."
  status="edit"
  {fileStatus}
  bind:files
  on:add={handleAdd}
  on:remove={handleRemove}
/>
