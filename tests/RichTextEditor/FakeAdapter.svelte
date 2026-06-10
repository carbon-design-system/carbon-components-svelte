<script lang="ts">
  import { getContext, onMount } from "svelte";

  export let active: string[] = [];
  export let onExecute: (command: {
    command: string;
    value?: { href?: string };
  }) => void = () => {};

  const editor = getContext<{
    registerEditor: (adapter: unknown) => () => void;
    refreshState: () => void;
  }>("carbon:RichTextEditor");

  const adapter = {
    execute: (command: { command: string; value?: { href?: string } }) =>
      onExecute(command),
    queryState: () => ({
      active: new Set(active),
      disabled: new Set<string>(),
    }),
    focus: () => {},
  };

  onMount(() => editor.registerEditor(adapter));

  $: {
    active;
    editor.refreshState();
  }
</script>
