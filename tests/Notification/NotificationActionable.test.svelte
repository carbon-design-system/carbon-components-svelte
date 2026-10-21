<script lang="ts">
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import NotificationActionButton from "carbon-components-svelte/Notification/NotificationActionButton.svelte";
  import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";

  export let type: "inline" | "toast" = "inline";
  export let actionable = true;
  export let focusOnOpen = true;
  export let closeOnEscape = true;
  export let open = false;
  export let withAction = true;
  export let hideCloseButton = false;
  export let title = "Record deleted";
  export let subtitle = "The record moved to the trash.";
  export let onClose: (event: CustomEvent) => void = () => {};
  export let onKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onKeydown}>
  <button type="button" on:click={() => (open = true)}>Delete</button>

  {#if type === "inline"}
    <InlineNotification
      bind:open
      {actionable}
      {focusOnOpen}
      {closeOnEscape}
      {hideCloseButton}
      {title}
      {subtitle}
      on:close={onClose}
    >
      <svelte:fragment slot="actions">
        {#if withAction}
          <NotificationActionButton>Undo</NotificationActionButton>
        {/if}
      </svelte:fragment>
    </InlineNotification>
  {:else}
    <ToastNotification
      bind:open
      {actionable}
      {focusOnOpen}
      {closeOnEscape}
      {hideCloseButton}
      {title}
      {subtitle}
      on:close={onClose}
    >
      {#if withAction}
        <NotificationActionButton>Undo</NotificationActionButton>
      {/if}
    </ToastNotification>
  {/if}

  <button type="button">After</button>
</div>
