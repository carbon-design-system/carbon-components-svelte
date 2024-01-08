<script>
  /**
   * Specify the current value
   * @type {number}
   */
  export let value = undefined;

  /** Specify the maximum value */
  export let max = 100;

  /**
   * Specify the kind of progress bar
   * @type {"default" | "inline" | "indented"}
   */
  export let kind = "default";

  /**
   * Specify the status
   * @type {"active" | "finished" | "error"}
   */
  export let status = "active";

  /**
   * Specify the size
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the progress bar element */
  export let id = "ccs-" + Math.random().toString(36);

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";

  const statusIcons = {
    error: ErrorFilled,
    finished: CheckmarkFilled,
  };

  let helperId = "ccs-" + Math.random().toString(36);

  $: indeterminate = value === undefined && status === "active";
  let capped;
  $: {
    if (status === "error" || value < 0) {
      capped = 0;
    } else if (value > max) {
      capped = max;
    } else {
      capped = value;
    }
  }
</script>

<div
  class:cds--progress-bar="{true}"
  class:cds--progress-bar--indeterminate="{indeterminate}"
  class:cds--progress-bar--big="{size === 'md'}"
  class:cds--progress-bar--small="{size === 'sm'}"
  class:cds--progress-bar--inline="{kind === 'inline'}"
  class:cds--progress-bar--indented="{kind === 'indented'}"
  class:cds--progress-bar--error="{status === 'error'}"
  class:cds--progress-bar--finished="{status === 'finished'}"
  {...$$restProps}
>
  <label
    for="{id}"
    class:cds--progress-bar__label="{true}"
    class:cds--visually-hidden="{hideLabel}"
  >
    <slot name="labelText">
      {labelText}
    </slot>
    {#if status === "error" || status === "finished"}
      <svelte:component
        this="{statusIcons[status]}"
        class="cds--progress-bar__status-icon"
      />
    {/if}
  </label>
  <div
    role="progressbar"
    id="{id}"
    class:cds--progress-bar__track="{true}"
    aria-busy="{status === 'active'}"
    aria-valuemin="{indeterminate ? undefined : 0}"
    aria-valuemax="{indeterminate ? undefined : max}"
    aria-valuenow="{indeterminate ? undefined : capped}"
    aria-describedby="{helperText ? helperId : null}"
  >
    <div
      class:cds--progress-bar__bar="{true}"
      style:transform="{status === "active" && `scaleX(${capped / max})`}"
    ></div>
  </div>
  {#if helperText}
    <div id="{helperId}" class:cds--progress-bar__helper-text="{true}">
      {helperText}
    </div>
  {/if}
</div>
