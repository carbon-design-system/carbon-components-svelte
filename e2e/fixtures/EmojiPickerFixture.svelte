<script>
  import {
    EmojiPicker,
    LocalStorage,
    Stack,
    TextArea,
  } from "carbon-components-svelte";

  // The data loads when a picker first needs it. The count lets a test see
  // that a page that only renders a button never downloads it.
  const load = () => {
    const counter = /** @type {any} */ (window);
    counter.__emojiLoads = (counter.__emojiLoads ?? 0) + 1;
    return import("carbon-components-svelte/emoji-data");
  };

  let value = "grinning_face";
  let skinTone = 0;
  let recent = ["red_heart"];
  let usage = {};
  let changes = [];
  let reactions = ["thumbs_up"];
  let reactionLog = [];
  let message = "Ship it ";
  let messageRef;
  let inlineValue;
  let prefs = { recent: [], usage: {}, skinTone: 0 };

  function insert({ detail }) {
    const start = messageRef.selectionStart;
    const end = messageRef.selectionEnd;
    message = message.slice(0, start) + detail.emoji + message.slice(end);
    const caret = start + detail.emoji.length;
    requestAnimationFrame(() => messageRef.setSelectionRange(caret, caret));
  }
</script>

<Stack gap={7}>
  <div data-testid="field" style:width="320px" style:max-width="100%">
    <EmojiPicker
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      bind:value
      bind:skinTone
      bind:recent
      bind:usage
      labelText="Status emoji"
      helperText="Shown next to your name"
      name="status-emoji"
      on:select={({ detail }) =>
        (changes = [...changes, `${detail.id}:${detail.emoji}`])}
    />
  </div>
  <div data-testid="invalid" style:width="320px" style:max-width="100%">
    <EmojiPicker
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      labelText="Invalid"
      invalid
      invalidText="Choose an emoji"
      searchLabelText="Search invalid"
    />
  </div>
  <div data-testid="disabled" style:width="320px" style:max-width="100%">
    <EmojiPicker
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      labelText="Disabled"
      value="thumbs_up"
      disabled
    />
  </div>
  <div data-testid="reactions">
    <EmojiPicker
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      variant="button"
      selectionMode="multiple"
      size="sm"
      labelText="Add reaction"
      searchLabelText="Search reactions"
      bind:values={reactions}
      on:select={({ detail }) =>
        (reactionLog = [
          ...reactionLog,
          `${detail.id}:${detail.selected ? "on" : "off"}`,
        ])}
    />
  </div>
  <div data-testid="insert" style:width="360px" style:max-width="100%">
    <TextArea
      bind:ref={messageRef}
      bind:value={message}
      labelText="Message"
      rows={3}
    />
    <EmojiPicker
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      variant="button"
      size="sm"
      labelText="Insert emoji"
      searchLabelText="Search to insert"
      on:select={insert}
    />
  </div>
  <div data-testid="inline">
    <EmojiPicker
      variant="inline"
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      bind:value={inlineValue}
      labelText="Inline"
      searchLabelText="Search inline"
    />
  </div>
  <div data-testid="detect" style:width="320px" style:max-width="100%">
    <EmojiPicker
      items={load}
      labelText="Detected"
      searchLabelText="Search detected"
    />
  </div>
  <div data-testid="persist" style:width="320px" style:max-width="100%">
    <LocalStorage key="emoji-picker-fixture" bind:value={prefs} />
    <EmojiPicker
      items={load}
      maxVersion={Number.POSITIVE_INFINITY}
      bind:recent={prefs.recent}
      bind:usage={prefs.usage}
      bind:skinTone={prefs.skinTone}
      labelText="Persisted"
      searchLabelText="Search persisted"
    />
  </div>
  <output data-testid="value">{value ?? ""}</output>
  <output data-testid="skin-tone">{skinTone}</output>
  <output data-testid="recent">{recent.join(",")}</output>
  <output data-testid="usage">{JSON.stringify(usage)}</output>
  <output data-testid="changes">{changes.join(",")}</output>
  <output data-testid="reactions-value">{reactions.join(",")}</output>
  <output data-testid="reaction-log">{reactionLog.join(",")}</output>
  <output data-testid="message">{message}</output>
  <output data-testid="prefs">{JSON.stringify(prefs)}</output>
</Stack>
