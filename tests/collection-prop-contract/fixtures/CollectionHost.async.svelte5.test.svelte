<svelte:options runes />

<script lang="ts">
  import { type Component, untrack } from "svelte";

  type Props = {
    component: Component<Record<string, unknown>>;
    prop: string;
    initial: unknown[];
    replacement: unknown[];
    props?: Record<string, unknown>;
    /** Receives the rendered component, for checks that call its methods. */
    onInstance?: (instance: unknown) => void;
  };

  const {
    component: Collection,
    prop,
    initial,
    replacement,
    props = {},
    onInstance = () => {},
  }: Props = $props();

  let instance: unknown = $state();

  $effect(() => onInstance(instance));

  // Read once, then never reassigned: the `$state` array is mutated in place.
  const collection = $state(untrack(() => initial));
</script>

<button
  type="button"
  onclick={() => collection.splice(0, collection.length, ...replacement)}
>
  Replace in place
</button>

<Collection bind:this={instance} {...props} {...{ [prop]: collection }} />
