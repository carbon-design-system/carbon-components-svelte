<script>
  /**
   * @event {string} delete
   */

  /**
   * Specify the file uploader status
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /**
   * Specify the size of button skeleton
   * @type {"default" | "field" | "small"}
   */
  export let size = "default";

  /** Specify the ARIA label used for the status icons */
  export let iconDescription = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the error subject text */
  export let errorSubject = "";

  /** Specify the error body text */
  export let errorBody = "";

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify the file uploader name */
  export let name = "";

  import { createEventDispatcher } from "svelte";
  import Filename from "./Filename.svelte";

  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<span
  id="{id}"
  class:bx--file__selected-file="{true}"
  class:bx--file__selected-file--invalid="{invalid}"
  class:bx--file__selected-file--md="{size === 'field'}"
  class:bx--file__selected-file--sm="{size === 'small'}"
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <p class:bx--file-filename="{true}">{name}</p>
  <span class:bx--file__state-container="{true}">
    <Filename
      on:keydown="{({ key }) => {
        if (key === ' ' || key === 'Enter') {
          dispatch('delete', id);
        }
      }}"
      on:click="{() => {
        dispatch('delete', id);
      }}"
      iconDescription="{iconDescription}"
      status="{status}"
      invalid="{invalid}"
    />
  </span>
  {#if invalid && errorSubject}
    <div class:bx--form-requirement="{true}">
      <div class:bx--form-requirement__title="{true}">{errorSubject}</div>
      {#if errorBody}
        <p class:bx--form-requirement__supplement="{true}">{errorBody}</p>
      {/if}
    </div>
  {/if}
</span>
