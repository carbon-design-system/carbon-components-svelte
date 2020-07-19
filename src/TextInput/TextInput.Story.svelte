<script>
  export let story = undefined;

  import PasswordInput from "./PasswordInput.svelte";
  import TextInput from "./TextInput.svelte";
  import TextInputSkeleton from "./TextInput.Skeleton.svelte";

  $: value = "";
  $: type = "password";
  $: ref = null;
  $: console.log(ref);
</script>

{#if story === 'skeleton'}
  <div
    aria-label="loading text input"
    aria-live="assertive"
    role="status"
    tabindex="0">
    <TextInputSkeleton />
    <br />
    <TextInputSkeleton hideLabel />
  </div>
{:else if story === 'password-visibility'}
  <PasswordInput {...$$props} aria-level="" />
{:else if story === 'controlled'}
  <PasswordInput {...$$props} {type} />
  <div>
    <button
      on:click={() => {
        type = 'text';
      }}>
      Show password
    </button>
    <button
      on:click={() => {
        type = 'password';
      }}>
      Hide password
    </button>
  </div>
{:else}
  <TextInput
    bind:ref
    {...$$props}
    bind:value
    on:change={() => {
      console.log('change');
    }} />
{/if}
