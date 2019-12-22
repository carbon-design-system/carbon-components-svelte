<script>
  let className = undefined;
  export { className as class };
  export let selected = 0;
  export let iconDescription = 'Show menu options';
  export let role = 'navigation';
  export let type = 'default';
  export let triggerHref = '#';
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import ChevronDownGlyph from 'carbon-icons-svelte/lib/ChevronDownGlyph';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _class = cx('--tabs', type === 'container' && '--tabs--container', className);
  let dropdownHidden = true;
  let tabs = writable([]);
  let tabsById = derived(tabs, _ => _.reduce((a, c) => ({ ...a, [c.id]: c }), {}));
  let currentIndex = selected;
  let selectedTab = writable(undefined);
  let content = writable([]);
  let selectedContent = writable(undefined);

  setContext('Tabs', {
    selectedTab,
    selectedContent,
    add: data => {
      tabs.update(_ => [..._, { ...data, index: _.length }]);
    },
    addContent: data => {
      content.update(_ => [..._, { ...data, index: _.length }]);
    },
    update: id => {
      currentIndex = $tabsById[id].index;
    },
    change: direction => {
      let index = currentIndex + direction;

      if (index < 0) {
        index = $tabs.length - 1;
      } else if (index >= $tabs.length) {
        index = 0;
      }

      let disabled = $tabs[index].disabled;

      while (disabled) {
        index = index + direction;

        if (index < 0) {
          index = $tabs.length - 1;
        } else if (index >= $tabs.length) {
          index = 0;
        }

        disabled = $tabs[index].disabled;
      }

      currentIndex = index;
    }
  });

  $: currentTab = $tabs[currentIndex] || undefined;
  $: currentContent = $content[currentIndex] || undefined;
  $: {
    selected = currentIndex;
    dispatch('change', currentIndex);

    if (currentTab) {
      selectedTab.set(currentTab.id);
    }

    if (currentContent) {
      selectedContent.set(currentContent.id);
    }
  }
  $: if ($selectedTab) {
    dropdownHidden = true;
  }
  $: _listClass = cx('--tabs__nav', dropdownHidden && '--tabs__nav--hidden');
</script>

<div class={_class} {style} {role}>
  <div
    role="listbox"
    tabindex="0"
    class={cx('--tabs-trigger')}
    aria-label={$$props['aria-label'] || 'listbox'}
    on:click={() => {
      dropdownHidden = !dropdownHidden;
    }}
    on:keypress
    on:keypress={() => {
      dropdownHidden = !dropdownHidden;
    }}>
    <a
      tabindex="-1"
      class={cx('--tabs-trigger-text')}
      href={triggerHref}
      on:click
      on:click={() => {
        dropdownHidden = !dropdownHidden;
      }}>
      {#if currentTab}{currentTab.label}{/if}
    </a>
    <ChevronDownGlyph aria-hidden="true" title={iconDescription} />
  </div>
  <ul role="tablist" class={_listClass}>
    <slot />
  </ul>
</div>
<slot name="content" />
