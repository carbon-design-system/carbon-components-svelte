<script lang="ts">
  import Section from "carbon-components-svelte/Heading/Section.svelte";
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
  import InterstitialScreenHeader from "carbon-components-svelte/InterstitialScreen/InterstitialScreenHeader.svelte";
  import InterstitialScreenView from "carbon-components-svelte/InterstitialScreen/InterstitialScreenView.svelte";
  import type { ComponentProps } from "svelte";

  export let isFullScreen = false;
  export let inSection = false;
  export let title = "Set up your workspace";
  export let subTitle = "This takes about two minutes.";
  export let headingLevel: ComponentProps<InterstitialScreenHeader>["headingLevel"] =
    undefined;
</script>

{#if inSection}
  <Section>
    <InterstitialScreen open {isFullScreen}>
      <InterstitialScreenHeader {title} {subTitle} {headingLevel} />
      <InterstitialScreenBody>
        <InterstitialScreenView
          ><p>Connect a data source.</p></InterstitialScreenView
        >
      </InterstitialScreenBody>
    </InterstitialScreen>
  </Section>
{:else}
  <InterstitialScreen open {isFullScreen}>
    <InterstitialScreenHeader {title} {subTitle} {headingLevel} />
    <InterstitialScreenBody>
      <InterstitialScreenView
        ><p>Connect a data source.</p></InterstitialScreenView
      >
    </InterstitialScreenBody>
  </InterstitialScreen>
{/if}
