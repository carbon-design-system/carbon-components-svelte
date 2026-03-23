<script>
  import { FileUploader } from "carbon-components-svelte";

  /** @type {Array<{ file: File; reason: string }>} */
  let rejectedMax = [];

  let filesMax = [];

  let filesPrepend = [];

  let filesIcon = [];
</script>

<section data-testid="section-max">
  <FileUploader
    data-testid="uploader-max"
    labelTitle="Max file size"
    labelDescription="Max 50 bytes."
    multiple
    maxFileSize={50}
    bind:files={filesMax}
    status="edit"
    buttonLabel="Add file"
    iconDescription="Remove file"
    on:rejected={(e) => {
      rejectedMax = e.detail;
    }}
  />
  <p data-testid="rejected-max-len">{rejectedMax.length}</p>
  {#if rejectedMax[0]}
    <p data-testid="rejected-max-reason">{rejectedMax[0].reason}</p>
  {/if}
</section>

<section data-testid="section-prepend">
  <FileUploader
    data-testid="uploader-prepend"
    labelTitle="Prepend order"
    multiple
    orderFiles="prepend"
    bind:files={filesPrepend}
    status="edit"
    buttonLabel="Add files"
    iconDescription="Remove file"
  />
</section>

<section data-testid="section-icon-fn">
  <FileUploader
    data-testid="uploader-icon-fn"
    labelTitle="Custom remove label"
    bind:files={filesIcon}
    status="edit"
    buttonLabel="Add file"
    iconDescription={(ctx) => `Custom remove ${ctx.fileName}`}
  />
</section>
