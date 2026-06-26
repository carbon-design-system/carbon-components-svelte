<script>
  import { ComboBox } from "carbon-components-svelte";

  // orwell is not the first option; native <select> would otherwise mask a reset.
  // make() returns a new array reference, like an async refetch.
  const make = () => [
    { id: "austen", text: "Jane Austen" },
    { id: "dickens", text: "Charles Dickens" },
    { id: "orwell", text: "George Orwell" },
    { id: "woolf", text: "Virginia Woolf" },
  ];

  const cbPreloadItems = make();
  let cbPreloadSelectedId = "orwell";
  let cbPreloadValue = "";

  let cbFillItems = [];
  let cbFillSelectedId = "orwell";
  let cbFillValue = "";

  let cbSwapItems = make();
  let cbSwapSelectedId = "orwell";
  let cbSwapValue = "George Orwell";

  function load() {
    cbFillItems = make();
  }

  function reload() {
    cbSwapItems = make();
  }

  function clearFill() {
    cbFillItems = [];
    cbFillValue = "";
  }
</script>

<button type="button" data-testid="load" on:click={load}>Load options</button>
<button type="button" data-testid="reload" on:click={reload}>
  Reload options
</button>
<button type="button" data-testid="clear-fill" on:click={clearFill}>
  Clear fill
</button>

<ComboBox
  data-testid="cb-preload"
  labelText="ComboBox preload"
  items={cbPreloadItems}
  bind:selectedId={cbPreloadSelectedId}
  bind:value={cbPreloadValue}
/>
<p data-testid="cb-preload-id">{cbPreloadSelectedId}</p>

<ComboBox
  data-testid="cb-fill"
  labelText="ComboBox fill"
  items={cbFillItems}
  bind:selectedId={cbFillSelectedId}
  bind:value={cbFillValue}
/>
<p data-testid="cb-fill-id">{cbFillSelectedId}</p>

<ComboBox
  data-testid="cb-swap"
  labelText="ComboBox swap"
  items={cbSwapItems}
  bind:selectedId={cbSwapSelectedId}
  bind:value={cbSwapValue}
/>
<p data-testid="cb-swap-id">{cbSwapSelectedId}</p>
