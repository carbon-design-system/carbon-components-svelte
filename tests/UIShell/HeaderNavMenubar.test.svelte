<script lang="ts">
  import HeaderNav from "carbon-components-svelte/UIShell/HeaderNav.svelte";
  import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
  import HeaderNavMenu from "carbon-components-svelte/UIShell/HeaderNavMenu.svelte";
  import HeaderSideNavItems from "carbon-components-svelte/UIShell/HeaderSideNavItems.svelte";
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";

  type Entry = { text: string; items?: ReadonlyArray<{ text: string }> };

  export let items: ReadonlyArray<Entry> = [
    { text: "Link 1" },
    {
      text: "Menu",
      items: [{ text: "Menu Item 1" }, { text: "Menu Item 2" }],
    },
    { text: "Link 2" },
  ];
  /** Text of the entry rendered with `isSelected`. */
  export let current = "";
  /** Renders a vertical `HeaderSideNavItems` in a `SideNav` instead of a `HeaderNav`. */
  export let side = false;
  /** Element placed after the nav: a button, an input, or an item outside any nav. */
  export let after: "button" | "input" | "item" | undefined = undefined;
  export let onClose: (menu: string, trigger: string) => void = () => {};
</script>

{#if side}
  <SideNav isOpen>
    <SideNavItems>
      <HeaderSideNavItems>
        {#each items as entry (entry.text)}
          {#if entry.items}
            <HeaderNavMenu
              text={entry.text}
              on:close={(e) => onClose(entry.text, e.detail.trigger)}
            >
              {#each entry.items as child (child.text)}
                <HeaderNavItem
                  href="/"
                  text={child.text}
                  isSelected={child.text === current}
                />
              {/each}
            </HeaderNavMenu>
          {:else}
            <HeaderNavItem
              href="/"
              text={entry.text}
              isSelected={entry.text === current}
            />
          {/if}
        {/each}
      </HeaderSideNavItems>
    </SideNavItems>
  </SideNav>
{:else}
  <HeaderNav>
    {#each items as entry (entry.text)}
      {#if entry.items}
        <HeaderNavMenu
          text={entry.text}
          on:close={(e) => onClose(entry.text, e.detail.trigger)}
        >
          {#each entry.items as child (child.text)}
            <HeaderNavItem
              href="/"
              text={child.text}
              isSelected={child.text === current}
            />
          {/each}
        </HeaderNavMenu>
      {:else}
        <HeaderNavItem
          href="/"
          text={entry.text}
          isSelected={entry.text === current}
        />
      {/if}
    {/each}
  </HeaderNav>
{/if}

{#if after === "button"}
  <button type="button">After</button>
{:else if after === "input"}
  <input aria-label="Search docs">
{:else if after === "item"}
  <HeaderNavItem href="/" text="Standalone" />
{/if}
