<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import { cx } from '../../lib';
  import Button from '../Button';
  import FileUploader from './FileUploader.svelte';
  import FileUploaderButton from './FileUploaderButton.svelte';
  import FileUploaderDropContainer from './FileUploaderDropContainer.svelte';
  import FileUploaderItem from './FileUploaderItem.svelte';
  import FileUploaderSkeleton from './FileUploader.Skeleton.svelte';

  let fileUploader = undefined;
  let files = [];

  $: disabled = files.length === 0;
</script>

<Layout>
  <div>
    {#if story === 'button'}
      <FileUploaderButton {...$$props} />
    {:else if story === 'drop container'}
      <FileUploaderDropContainer
        {...$$props}
        on:add={({ detail }) => {
          console.log(detail);
        }} />
    {:else if story === 'item'}
      <FileUploaderItem
        {...$$props}
        on:delete={({ detail }) => {
          console.log(detail);
        }}
        on:click={() => {
          console.log('click');
        }} />
    {:else if story === 'uploader'}
      <div class={cx('--file__container')}>
        <FileUploader
          bind:this={fileUploader}
          {...$$props}
          bind:files
          on:add={({ detail }) => {
            console.log('add', detail);
          }}
          on:remove={({ detail }) => {
            console.log('remove', detail);
          }} />
        <Button
          kind="secondary"
          size="small"
          style="margin-top: 1rem"
          {disabled}
          on:click={fileUploader.clearFiles}>
          Clear File{files.length === 1 ? '' : 's'}
        </Button>
      </div>
    {:else if story === 'skeleton'}
      <div style="width: 500px">
        <FileUploaderSkeleton />
      </div>
    {/if}
  </div>
</Layout>
