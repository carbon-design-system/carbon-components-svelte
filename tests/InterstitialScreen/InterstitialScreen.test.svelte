<script lang="ts">
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
  import InterstitialScreenFooter from "carbon-components-svelte/InterstitialScreen/InterstitialScreenFooter.svelte";
  import InterstitialScreenHeader from "carbon-components-svelte/InterstitialScreen/InterstitialScreenHeader.svelte";
  import InterstitialScreenView from "carbon-components-svelte/InterstitialScreen/InterstitialScreenView.svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<InterstitialScreen>["open"] = false;
  export let isFullScreen: ComponentProps<InterstitialScreen>["isFullScreen"] = false;
  export let launcherButtonRef: ComponentProps<InterstitialScreen>["launcherButtonRef"] =
    undefined;

  export let title = "";
  export let subTitle = "";
  export let hideProgressIndicator = false;
  export let stepCount = 1;
  export let skipButtonText = "Skip";
  export let loadingAction: ComponentProps<InterstitialScreenFooter>["loadingAction"] =
    "";

  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let onaction: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<button
  type="button"
  bind:this={launcherButtonRef}
  on:click={() => (open = true)}
>
  Open launcher
</button>

<InterstitialScreen
  bind:open
  {isFullScreen}
  {launcherButtonRef}
  on:close={(e) => onclose?.(e)}
>
  <InterstitialScreenHeader {title} {subTitle} {hideProgressIndicator} />
  <InterstitialScreenBody>
    {#each Array.from({ length: stepCount }) as _, i (i)}
      <InterstitialScreenView stepTitle={`Step ${i + 1}`}>
        <p>Content {i + 1}</p>
      </InterstitialScreenView>
    {/each}
  </InterstitialScreenBody>
  <InterstitialScreenFooter
    {skipButtonText}
    bind:loadingAction
    on:action={(e) => onaction?.(e)}
  />
</InterstitialScreen>
