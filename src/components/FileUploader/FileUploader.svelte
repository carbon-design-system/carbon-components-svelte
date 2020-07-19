<script>
  export let status = "uploading"; // "uploading" | "edit" | "complete"
  export let accept = [];
  export let files = [];
  export const clearFiles = () => (files = []);
  export let buttonLabel = "";
  export let iconDescription = "Provide icon description";
  export let kind = "primary";
  export let labelDescription = "";
  export let labelTitle = "";
  export let multiple = false;
  export let name = "";

  import { createEventDispatcher, afterUpdate } from "svelte";
  import Filename from "./Filename.svelte";
  import FileUploaderButton from "./FileUploaderButton.svelte";

  const dispatch = createEventDispatcher();

  $: prevFiles = [];

  afterUpdate(() => {
    if (files.length > prevFiles.length) {
      dispatch("add", files);
    } else {
      dispatch("remove", prevFiles.filter(_ => !files.includes(_)));
    }

    prevFiles = [...files];
  });
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <strong class:bx--file--label={true}>{labelTitle}</strong>
  <p class:bx--label-description={true}>{labelDescription}</p>
  <FileUploaderButton
    disableLabelChanges
    labelText={buttonLabel}
    {accept}
    {name}
    {multiple}
    {kind}
    on:change
    on:change={({ target }) => {
      files = [...target.files].map(({ name }) => name);
    }} />
  <div class:bx--file-container={true}>
    {#each files as name, i (name)}
      <span class:bx--file__selected-file={true}>
        <p class:bx--file-filename={true}>{name}</p>
        <span class:bx--file__state-container={true}>
          <Filename
            {iconDescription}
            {status}
            on:keydown
            on:keydown={({ key }) => {
              if (key === ' ' || key === 'Enter') {
                files = files.filter((_, index) => index !== i);
              }
            }}
            on:click
            on:click={() => {
              files = files.filter((_, index) => index !== i);
            }} />
        </span>
      </span>
    {/each}
  </div>
</div>
