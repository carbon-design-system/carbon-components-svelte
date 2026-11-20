<script>
  import {
    Highlight,
    highlightText,
    matchText,
    TextInput,
    textSnippet,
  } from "carbon-components-svelte";

  let query = "cafe";

  const items = [
    "Café au lait",
    "Crème brûlée and cafe noir",
    "Straße with café decomposed",
    "İstanbul Cafe",
    "No match in this one",
  ];

  const long =
    "The quick brown fox jumps over the lazy dog while the sleepy cat watches from a distant windowsill and the ordinary bird sings loudly in the tree near the river bank where the cafe stands at the corner of the old market.";

  $: snippet = textSnippet(long, matchText(long, query), {
    maxLength: 90,
    context: 16,
  });

  // The same Latin term in Arabic and Hebrew paragraphs, plus a plain copy of
  // each to compare layout against.
  const arabic = "هذا نص عربي فيه كلمة hello في الوسط ثم المزيد من النص";
  const hebrew = "זהו טקסט בעברית עם המילה hello באמצע ועוד טקסט";
</script>

<TextInput
  labelText="Query"
  placeholder="Type a query"
  bind:value={query}
  data-testid="query"
/>

<ul data-testid="list">
  {#each items as item (item)}
    <li><Highlight text={item} {query} /></li>
  {/each}
</ul>

<p data-testid="bold">
  <Highlight text="Café au lait" {query} variant="bold" />
</p>
<p data-testid="decorative">
  <Highlight text="Café au lait" {query} decorative />
</p>
<button type="button" data-testid="button">
  <Highlight text="Café au lait" {query} />
</button>

<p data-testid="snippet">
  <Highlight text={snippet.text} ranges={snippet.ranges} />
</p>

<div use:highlightText={{ query }} data-testid="api">
  <p>Café au lait, and a second line with cafe in it.</p>
  <p>Nothing to see here.</p>
</div>

<div dir="rtl" lang="ar" data-testid="arabic">
  <Highlight text={arabic} query="hello" />
</div>
<div dir="rtl" lang="ar" data-testid="arabic-plain">{arabic}</div>
<div dir="rtl" lang="he" data-testid="hebrew">
  <Highlight text={hebrew} query="hello" />
</div>
<div dir="rtl" lang="he" data-testid="hebrew-plain">{hebrew}</div>
<div dir="rtl" lang="ar" data-testid="arabic-partial">
  <Highlight text="مرحبا بالعالم" query="رحب" />
</div>
