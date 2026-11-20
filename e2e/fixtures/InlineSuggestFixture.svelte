<script>
  import {
    InlineSuggest,
    Stack,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";

  const domains = ["gmail.com", "github.com", "outlook.com", "icloud.com"];
  const recents = [
    "Quarterly report",
    "Quarterly review notes",
    "שלום עולם",
    "مرحبا بالعالم",
  ];
  const sentences = [
    "Thanks for reaching out. We will get back to you within two business days.",
    "Thanks again for your patience while we look into this.",
  ];
  const LONG =
    " and then the line keeps going well past the edge of the field so that the suggestion has to wrap onto several lines of the text area, one after another, until it runs out of room and the box has to scroll to follow it down";

  const ARABIC = /[\u0600-\u06FF]/;
  const LONG_AR =
    " ثم يستمر السطر إلى ما بعد حافة الحقل حتى يضطر الاقتراح إلى الالتفاف على عدة أسطر من مربع النص واحدا تلو الآخر حتى ينفد المكان";

  /** Tests set `window.__latency(value)` to slow the answer for some texts. */
  const sleep = (/** @type {number} */ ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /** @param {string} value @param {{ signal: AbortSignal }} context */
  async function complete(value, { signal }) {
    const wait = window.__latency?.(value) ?? 40;
    await sleep(wait);
    if (signal.aborted && !window.__ignoreAbort) return "";
    const match = sentences.find(
      (sentence) =>
        sentence.length > value.length &&
        sentence.toLowerCase().startsWith(value.toLowerCase()),
    );
    return match ? match.slice(value.length) : "";
  }

  /** @param {string} value */
  const long = (value) =>
    value.length === 0 ? "" : ARABIC.test(value) ? LONG_AR : LONG;

  let email = "";
  let message = "";
  let notes = "";
  let search = "";
  let subject = "";
  let subjectRef;
  let ref;
  let messageRef;
  let notesRef;
  let searchRef;
</script>

<Stack gap={6} style="max-width: 24rem; padding: 1rem">
  <div>
    <TextInput
      bind:ref
      bind:value={email}
      labelText="Email"
      helperText="Type an address"
    />
    <InlineSuggest field={ref} source={domains} after="@" />
  </div>
  <div>
    <TextArea
      bind:ref={messageRef}
      bind:value={message}
      labelText="Message"
      rows={4}
    />
    <InlineSuggest field={messageRef} source={complete} debounce={80} />
  </div>
  <div>
    <TextArea
      bind:ref={notesRef}
      bind:value={notes}
      labelText="Notes"
      rows={4}
    />
    <InlineSuggest field={notesRef} source={long} debounce={0} />
  </div>
  <div>
    <TextInput bind:ref={subjectRef} bind:value={subject} labelText="Subject" />
    <InlineSuggest field={subjectRef} source={long} debounce={0} />
  </div>
  <div>
    <TextInput
      bind:ref={searchRef}
      bind:value={search}
      labelText="Search"
      placeholder="Recent searches"
    />
    <InlineSuggest
      field={searchRef}
      source={recents}
      minLength={0}
      acceptButton
    />
  </div>
  <!-- A field that is not under InlineSuggest, to move focus to. -->
  <TextInput labelText="After" />
</Stack>
