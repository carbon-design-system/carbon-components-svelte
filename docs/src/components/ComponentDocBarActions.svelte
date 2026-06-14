<script lang="ts">
  import {
    Button,
    Link,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";
  import { createCopyFeedbackState } from "carbon-components-svelte/src/utils/copyFeedback.js";
  import ArrowUpRight from "carbon-icons-svelte/lib/ArrowUpRight.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import OverflowMenuVertical from "carbon-icons-svelte/lib/OverflowMenuVertical.svelte";
  import type { Component } from "svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import { copyComponentMarkdown } from "../copy-markdown";
  import CopyMarkdownButton from "./CopyMarkdownButton.svelte";

  export let component: string;
  export let sourceCode: string;
  export let markdownUrl: string;
  export let markdownBytes = 0;
  export let tocToggleIcon: Component;
  export let tocToggleDescription: string;

  const dispatch = createEventDispatcher();

  let copied = false;
  let copying = false;

  const copyFeedback = createCopyFeedbackState(() => {
    copied = copyFeedback.feedbackOpen;
    copying = copyFeedback.copyPending;
  });

  async function copyMarkdownFromMenu() {
    await copyFeedback.onClick(
      async () => {
        const ok = await copyComponentMarkdown(component, markdownUrl);
        if (!ok) throw new Error("Failed to copy markdown");
      },
      2000,
      false,
    );
  }

  onMount(() => copyFeedback.cleanup);
</script>

<div class="bar-actions bar-actions--desktop">
  <Stack orientation="horizontal" align="center" gap={4}>
    <Link icon={ArrowUpRight} href={sourceCode} target="_blank">
      Source code
    </Link>
    <Link icon={ArrowUpRight} href={markdownUrl} target="_blank">
      Markdown
    </Link>
    <div>
      <CopyMarkdownButton
        name={component}
        href={markdownUrl}
        bytes={markdownBytes}
        size="small"
        tooltipPosition="bottom"
      />
      <Button
        class="toc-toggle-btn"
        kind="ghost"
        size="small"
        icon={tocToggleIcon}
        iconDescription={tocToggleDescription}
        tooltipPosition="bottom"
        on:click={() => dispatch("tocToggle")}
      />
    </div>
  </Stack>
</div>

<div class="bar-actions bar-actions--mobile">
  <OverflowMenu flipped icon={OverflowMenuVertical}>
    <OverflowMenuItem
      icon={Code}
      text="Source code"
      href={sourceCode}
      target="_blank"
    />
    <OverflowMenuItem
      icon={Document}
      text="View Markdown"
      href={markdownUrl}
      target="_blank"
    />
    <OverflowMenuItem
      icon={Copy}
      text={copied ? "Copied!" : "Copy Markdown"}
      disabled={copying}
      on:click={copyMarkdownFromMenu}
    />
  </OverflowMenu>
</div>

<style>
  .bar-actions--mobile {
    display: none;
  }

  @media (max-width: 1056px) {
    .bar-actions--desktop {
      display: none;
    }

    .bar-actions--mobile {
      display: block;
    }
  }
</style>
