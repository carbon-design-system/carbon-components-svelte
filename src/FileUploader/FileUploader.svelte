<script>
  /**
   * @event {File[]} add
   * @event {File[]} remove
   */

  /**
   * Specify the file uploader status
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /**
   * Specify the accepted file types
   * @type {string[]}
   */
  export let accept = [];

  /**
   * Obtain the uploaded file names
   * @type {File[]}
   */
  export let files = [];

  /** Set to `true` to allow multiple files */
  export let multiple = false;

  /**
   * Override the default behavior of clearing the array of uploaded files
   * @type {() => void}
   */
  export const clearFiles = () => {
    files = [];
  };

  /** Specify the label description */
  export let labelDescription = "";

  /** Specify the label title */
  export let labelTitle = "";

  /**
   * Specify the kind of file uploader button
   * @type {"primary" | "secondary" | "tertiary" | "ghost" | "danger"}
   */
  export let kind = "primary";

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

  $: prevFiles = [];

  afterUpdate(() => {
    if (files.length > prevFiles.length) {
      dispatch("add", files);
    } else {
      dispatch(
        "remove",
        prevFiles.filter((_) => !files.includes(_))
      );
    }

    prevFiles = [...files];
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <p class:bx--file--label="{true}">{labelTitle}</p>
  <p class:bx--label-description="{true}">{labelDescription}</p>
  <FileUploaderButton
    disableLabelChanges
    labelText="{buttonLabel}"
    accept="{accept}"
    name="{name}"
    multiple="{multiple}"
    kind="{kind}"
    on:change
    on:change="{({ target }) => {
      files = [...target.files];
    }}"
  />
  <div class:bx--file-container="{true}">
    {#each files as { name }, i (name)}
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
