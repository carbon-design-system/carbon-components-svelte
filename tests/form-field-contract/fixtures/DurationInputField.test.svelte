<script lang="ts">
  import DurationInput from "carbon-components-svelte/DurationInput/DurationInput.svelte";

  // The contract binds one string and reads the field back as the digits it
  // shows. The field holds milliseconds, so `value` is those digits as
  // `hhmmss`, which makes the same reset and state checks apply.
  export let value = "";

  const pad = (count: number) => String(count).padStart(2, "0");

  function toMilliseconds(digits: string) {
    if (digits === "") return null;
    return (
      (Number(digits.slice(0, 2)) * 3600 +
        Number(digits.slice(2, 4)) * 60 +
        Number(digits.slice(4, 6))) *
      1000
    );
  }

  function toDigits(milliseconds: number | null) {
    if (milliseconds == null) return "";
    const seconds = Math.round(milliseconds / 1000);
    return (
      pad(Math.floor(seconds / 3600)) +
      pad(Math.floor(seconds / 60) % 60) +
      pad(seconds % 60)
    );
  }

  let milliseconds = toMilliseconds(value);

  $: value = toDigits(milliseconds);
</script>

<DurationInput bind:value={milliseconds} {...$$restProps} on:change>
  <svelte:fragment slot="labelChildren"
    ><slot name="labelChildren" /></svelte:fragment
  >
</DurationInput>
