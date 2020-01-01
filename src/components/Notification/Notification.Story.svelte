<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import InlineNotification from './InlineNotification.svelte';
  import NotificationActionButton from './NotificationActionButton.svelte';
  import ToastNotification from './ToastNotification.svelte';
</script>

<Layout>
  {#if story === 'inline'}
    <InlineNotification {...$$props}>
      <div slot="actions">
        <NotificationActionButton>{$$props.action}</NotificationActionButton>
      </div>
    </InlineNotification>
  {:else if story === 'toast'}
    <ToastNotification {...$$props} style="min-width: 30rem; margin-bottom: .5rem" />
  {/if}
</Layout>
