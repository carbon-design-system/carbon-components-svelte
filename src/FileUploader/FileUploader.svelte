<script>
  /**
   * @event {ReadonlyArray<File>} add
   * @event {ReadonlyArray<File>} remove
   * @event {ReadonlyArray<File>} change
   */

  /**
   * Specify the file uploader status
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /** Set to `true` to disable the file uploader */
  export let disabled = false;

  /**
   * Specify the accepted file types
   * @type {ReadonlyArray<string>}
   */
  export let accept = [];

  /**
   * Obtain a reference to the uploaded files
   * @type {ReadonlyArray<File>}
   */
  export let files = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /**
   * Programmatically clear the uploaded files
   * @type {() => void}
   */
  export const clearFiles = () => {
    files = [];
  };

  /**
   * Specify the label title.
   * Alternatively, use the named slot "labelTitle" (e.g., `<span slot="labelTitle">...</span>`)
   */
  export let labelTitle = "";

  /**
   * Specify the label description.
   * Alternatively, use the named slot "labelDescription" (e.g., `<span slot="labelDescription">...</span>`)
   */
  export let labelDescription = "";

  /**
   * Specify the kind of file uploader button
   * @type {import("../Button/Button.svelte").ButtonProps["kind"]}
   */
  export let kind = "primary";

  /**
   * Specify the size of the file uploader button
   * @type {import("../Button/Button.svelte").ButtonProps["size"]}
   */
  export let size = "small";

  /** Specify the button label */
  export let buttonLabel = "";

  /** Specify the ARIA label used for the status icons */
  export let iconDescription = "Provide icon description";

  /** Specify a name attribute for the file button uploader input */
  export let name = "";

  import { createEventDispatcher, afterUpdate } from "svelte";
  import Filename from "./Filename.svelte";
  import FileUploaderButton from "./FileUploaderButton.svelte";

  const dispatch = createEventDispatcher();

  let prevFiles = [];

  /** @type {(file: File) => string} */
  const getFileId = (file) => file.lastModified + file.name;

  afterUpdate(() => {
    const fileIds = files.map(getFileId);
    const prevFileIds = prevFiles.map(getFileId);
    const addedIds = fileIds.filter((_) => !prevFileIds.includes(_));
    const removedIds = prevFileIds.filter((_) => !fileIds.includes(_));

    if (addedIds.length > 0) {
      dispatch(
        "add",
        addedIds.map((id) => files.find((file) => id === getFileId(file)))
      );
    }

    if (removedIds.length > 0) {
      dispatch(
        "remove",
        removedIds.map((id) => prevFiles.find((file) => id === getFileId(file)))
      );
    }

    prevFiles = [...files];
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if labelTitle || $$slots.labelTitle}
    <p
      class:bx--file--label="{true}"
      class:bx--label-description--disabled="{disabled}"
    >
      <slot name="labelTitle">
        {labelTitle}
      </slot>
    </p>
  {/if}
  {#if labelDescription || $$slots.labelDescription}
    <p
      class:bx--label-description="{true}"
      class:bx--label-description--disabled="{disabled}"
    >
      <slot name="labelDescription">
        {labelDescription}
      </slot>
    </p>
  {/if}
  <FileUploaderButton
    disabled="{disabled}"
    disableLabelChanges
    labelText="{buttonLabel}"
    accept="{accept}"
    name="{name}"
    multiple="{multiple}"
    kind="{kind}"
    size="{size}"
    on:change
    on:change="{(e) => {
      files = e.detail;
    }}"
  />
  <div class:bx--file-container="{true}">
    {#each files as { name }, i}
      <span class:bx--file__selected-file="{true}">
        <p class:bx--file-filename="{true}">{name}</p>
        <span class:bx--file__state-container="{true}">
          <Filename
            iconDescription="{iconDescription}"
            status="{status}"
            on:keydown
            on:keydown="{({ key }) => {
              if (key === ' ' || key === 'Enter') {
                files = files.filter((_, index) => index !== i);
              }
            }}"
            on:click
            on:click="{() => {
              files = files.filter((_, index) => index !== i);
            }}"
          />
        </span>
      </span>
    {/each}
  </div>
</div>
