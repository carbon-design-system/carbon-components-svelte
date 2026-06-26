<script>
  import { ComboBox, Select, SelectItem } from "carbon-components-svelte";

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

  let selFillItems = [];
  let selFillSelected = "orwell";

  let selSwapItems = make();
  let selSwapSelected = "orwell";

  function load() {
    cbFillItems = make();
    selFillItems = make();
  }

  function reload() {
    cbSwapItems = make();
    selSwapItems = make();
  }

  function clearFill() {
    cbFillItems = [];
    cbFillValue = "";
    selFillItems = [];
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

<Select
  data-testid="sel-fill"
  labelText="Select fill"
  bind:selected={selFillSelected}
>
  {#each selFillItems as item (item.id)}
    <SelectItem value={item.id} text={item.text} />
  {/each}
</Select>
<p data-testid="sel-fill-selected">{selFillSelected}</p>

<Select
  data-testid="sel-swap"
  labelText="Select swap"
  bind:selected={selSwapSelected}
>
  {#each selSwapItems as item (item.id)}
    <SelectItem value={item.id} text={item.text} />
  {/each}
</Select>
<p data-testid="sel-swap-selected">{selSwapSelected}</p>
