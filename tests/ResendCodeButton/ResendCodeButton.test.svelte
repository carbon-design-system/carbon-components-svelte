<svelte:options accessors />

<script lang="ts">
  import ResendCodeButton from "carbon-components-svelte/ResendCodeButton/ResendCodeButton.svelte";
  import type { ComponentProps } from "svelte";

  export let cooldown: ComponentProps<ResendCodeButton>["cooldown"] = 30;
  export let startOnMount: ComponentProps<ResendCodeButton>["startOnMount"] = true;
  export let labelText: ComponentProps<ResendCodeButton>["labelText"] =
    "Resend code";
  export let cooldownText: ComponentProps<ResendCodeButton>["cooldownText"] =
    undefined;
  export let disabled: ComponentProps<ResendCodeButton>["disabled"] = false;
  export let remaining = 0;
  export let preventResend = false;

  let button: ResendCodeButton;

  export function start() {
    button.start();
  }

  export function reset() {
    button.reset();
  }
</script>

<ResendCodeButton
  bind:this={button}
  bind:remaining
  {cooldown}
  {startOnMount}
  {labelText}
  {...cooldownText ? { cooldownText } : {}}
  {disabled}
  on:resend={(e) => {
    console.log("resend");
    if (preventResend) e.preventDefault();
  }}
/>
