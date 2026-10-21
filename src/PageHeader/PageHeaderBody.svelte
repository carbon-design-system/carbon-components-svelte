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

  const pageHeader = getContext("carbon:PageHeader");

  // The header's `Tabs` can mount after this body or be replaced, so resolve
  // them on each access instead of capturing them once.
  /** @type {import("../Tabs/Tabs.svelte").CarbonTabsContext} */
  const tabs = new Proxy({}, { get: (_, key) => pageHeader?.getTabs()?.[key] });

  if (pageHeader) setContext("carbon:Tabs", tabs);

  // `Tabs` nested inside a panel belong to the body, not the header.
  setContext("carbon:PageHeader", undefined);
</script>

<div bind:this={ref} class:bx--page-header__body={true}>
  <slot />
</div>
