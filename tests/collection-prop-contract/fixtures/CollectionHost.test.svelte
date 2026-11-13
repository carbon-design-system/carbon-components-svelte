<script lang="ts">
  import type { ComponentType } from "svelte";

  export let component: ComponentType;
  export let prop: string;
  export let initial: unknown[];
  export let replacement: unknown[];
  export let props: Record<string, unknown> = {};
  /** Receives the rendered component, for checks that call its methods. */
  export let onInstance: (instance: unknown) => void = () => {};

  let instance: unknown;

  let collection = initial;

  $: collectionProps = { [prop]: collection };
  $: onInstance(instance);
</script>

<button
  type="button"
  on:click={() => {
    collection.splice(0, collection.length, ...replacement);
    collection = collection;
  }}
>
  Replace in place
</button>

<svelte:component
  this={component}
  bind:this={instance}
  {...props}
  {...collectionProps}
/>
