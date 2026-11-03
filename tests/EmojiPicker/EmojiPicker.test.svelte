<script lang="ts">
  import EmojiPicker from "carbon-components-svelte/EmojiPicker/EmojiPicker.svelte";

  export let value: string | undefined = undefined;
  export let values: string[] = [];
  export let skinTone: 0 | 1 | 2 | 3 | 4 | 5 = 0;
  export let recent: string[] = [];
  export let usage: Record<string, number> = {};
  export let variant: "field" | "button" | "inline" = "field";
  export let selectionMode: "single" | "multiple" = "single";
  export let name = "";
  export let maxVersion: number | undefined = Number.POSITIVE_INFINITY;
  /** Groups given directly, or as a function that returns a promise of them. */
  export let mode: "groups" | "function" = "groups";
  export let open = false;

  let loads = 0;
  let selects: string[] = [];

  const groups = [
    {
      id: "people-body",
      label: "People & Body",
      emoji: [
        "\u{1F44D};thumbs up;0.6;0;+1|like",
        "\u{1F44B};waving hand;0.6;0;hello|wave",
      ],
    },
    {
      id: "smileys-emotion",
      label: "Smileys & Emotion",
      emoji: [
        "\u{1F600};grinning face;1;;cheerful|grin",
        "\u{1F602};face with tears of joy;0.6;;lol|laugh",
        "\u{1F9CC};troll;14;;",
      ],
    },
  ];

  function load() {
    loads += 1;
    return Promise.resolve({ default: groups });
  }

  $: items = mode === "function" ? load : groups;
</script>

<EmojiPicker
  bind:value
  bind:values
  bind:skinTone
  bind:recent
  bind:usage
  bind:open
  {variant}
  {selectionMode}
  {name}
  {maxVersion}
  {items}
  labelText={variant === "button" ? "Add emoji" : "Emoji"}
  on:select={({ detail }) =>
    (selects = [
      ...selects,
      `${detail.id}:${detail.emoji}:${detail.selected ? "on" : "off"}`,
    ])}
/>
<output data-testid="value">{value ?? ""}</output>
<output data-testid="values">{values.join(",")}</output>
<output data-testid="skin-tone">{skinTone}</output>
<output data-testid="recent">{recent.join(",")}</output>
<output data-testid="usage">{JSON.stringify(usage)}</output>
<output data-testid="selects">{selects.join(" ")}</output>
<output data-testid="loads">{loads}</output>
<output data-testid="open">{open}</output>
