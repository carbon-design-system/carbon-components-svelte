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
  <PasswordInput
    {...$$props}
    aria-level=""
    on:keydown="{(e) => {
      console.log('on:keydown', e);
    }}" />
{:else if story === 'controlled'}
  <PasswordInput
    {...$$props}
    type="{type}"
    on:keydown="{(e) => {
      console.log('on:keydown', e);
    }}" />
  <div>
    <button
      on:click="{() => {
        type = 'text';
      }}">
      Show password
    </button>
    <button
      on:click="{() => {
        type = 'password';
      }}">
      Hide password
    </button>
  </div>
{:else}
  <TextInput
    bind:ref
    {...$$props}
    bind:value
    on:keydown="{(e) => {
      console.log('on:keydown', e);
    }}"
    on:change="{() => {
      console.log('change');
    }}" />
{/if}
