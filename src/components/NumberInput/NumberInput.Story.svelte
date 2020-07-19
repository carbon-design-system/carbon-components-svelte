<script>
  export let story = undefined;

  import NumberInput from "./NumberInput.svelte";
  import NumberInputSkeleton from "./NumberInput.Skeleton.svelte";

  $: value = $$props.value;
</script>

{#if story === 'skeleton'}
  <NumberInputSkeleton {...$$props} />
{:else}
  <NumberInput
    {...$$props}
    id="number-input-id"
    name="number-input-id"
    bind:value
    on:change={({ detail }) => {
      console.log('on:change', detail);
    }} />
{/if}
