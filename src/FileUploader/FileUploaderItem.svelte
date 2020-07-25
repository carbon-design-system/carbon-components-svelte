<script>
  export let errorBody = "";
  export let errorSubject = "";
  export let iconDescription = "";

  /**
   * Set an id for the top-level element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let invalid = false;
  export let name = "";
  export let status = "uploading";

  import { createEventDispatcher } from "svelte";
  import Filename from "./Filename.svelte";

  const dispatch = createEventDispatcher();
</script>

<span
  {id}
  class:bx--file__selected-file={true}
  class:bx--file__selected-file--invalid={invalid}
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <p class:bx--file-filename={true}>{name}</p>
  <span class:bx--file__state-container={true}>
    <Filename
      on:keydown={({ key }) => {
        if (key === ' ' || key === 'Enter') {
          dispatch('delete', id);
        }
      }}
      on:click={() => {
        dispatch('delete', id);
      }}
      {iconDescription}
      {status}
      {invalid} />
  </span>
  {#if invalid && errorSubject}
    <div class:bx--form-requirement={true}>
      <div class:bx--form-requirement__title={true}>{errorSubject}</div>
      {#if errorBody}
        <p class:bx--form-requirement__supplement={true}>{errorBody}</p>
      {/if}
    </div>
  {/if}
</span>
