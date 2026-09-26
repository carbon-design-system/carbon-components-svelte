<script>
  /**
   * Internal: the page body rendered after the `<header>`. Not exported from
   * the package; only `PageHeader` ships. Re-provides the slotted `Tabs`
   * context so `TabContent` placed in the body pairs with the header's tabs.
   * @slot {{}}
   */

  /**
   * Obtain a reference to the body element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, setContext } from "svelte";

  const tabs = getContext("carbon:PageHeader")?.getTabs();

  if (tabs) setContext("carbon:Tabs", tabs);

  // `Tabs` nested inside a panel belong to the body, not the header.
  setContext("carbon:PageHeader", undefined);
</script>

<div bind:this={ref} class:bx--page-header__body={true}>
  <slot />
</div>
