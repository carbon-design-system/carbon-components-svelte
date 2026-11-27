<script>
  /**
   * @event {{ base: import("../Theme/Theme.svelte").CarbonTheme; tokens: Record<string, string>; resolved: Record<string, string>; }} change - Dispatched when the user changes the base theme, a token, or `derive`, or applies an import.
   * @slot {{ theme: import("../Theme/Theme.svelte").CarbonTheme; style: string; resolved: Record<string, string>; }} preview - Replace the preview gallery. Pass `style` to every `ThemeZone` you render, since a zone drops the overrides of the zone around it.
   */

  /**
   * A live Carbon theme customizer. Pick a base theme, override tokens,
   * preview the result on real components, check contrast, and export CSS,
   * Sass, or Design Tokens JSON. Only works with
   * `carbon-components-svelte/css/all.css`.
   *
   * @example
   * ```svelte
   * <ThemeBuilder bind:base bind:tokens bind:resolved />
   * <Theme theme={base} tokens={resolved} />
   * ```
   */

  /**
   * Specify the base theme.
   * @type {import("../Theme/Theme.svelte").CarbonTheme}
   * @bindable writable
   */
  export let base = "white";

  /**
   * Token overrides the user set, by token name (`"interactive"`,
   * `"layer-01"`). Tokens derived from them are not listed here.
   * @type {Record<string, string>}
   * @bindable writable
   */
  export let tokens = {};

  /**
   * Every token that differs from the base theme: the overrides, the tokens
   * derived from them, and the contextual tokens that follow a numbered one
   * (`layer` for `layer-01`). Pass it to `Theme`'s `tokens`.
   * @type {Record<string, string>}
   * @bindable readonly
   */
  export let resolved = {};

  /**
   * Set to `false` to stop hover, active, and brand tokens from following the
   * token Carbon derives them from.
   */
  export let derive = true;

  /** Set to `true` to keep the theme in `window.localStorage`. */
  export let persist = false;

  /** Specify the local storage key. */
  export let persistKey = "theme-builder";

  /**
   * Set to `true` to read a theme from the URL hash on mount, as written by
   * the share link.
   */
  export let readHash = false;

  /**
   * Specify an id. The ids of the controls inside derive from it.
   */
  export let id = uniqueId();

  /** Specify the selector the CSS export applies to. */
  export let selector = ":root";

  /**
   * Set to `true` to hide the contrast checks.
   */
  export let hideContrast = false;

  /** Set to `true` to hide the export and import panel. */
  export let hideExport = false;

  import { createEventDispatcher, onMount } from "svelte";
  import Accordion from "../Accordion/Accordion.svelte";
  import AccordionItem from "../Accordion/AccordionItem.svelte";
  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import CodeSnippet from "../CodeSnippet/CodeSnippet.svelte";
  import CopyInput from "../CopyInput/CopyInput.svelte";
  import LocalStorage from "../LocalStorage/LocalStorage.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import Tab from "../Tabs/Tab.svelte";
  import TabContent from "../Tabs/TabContent.svelte";
  import Tabs from "../Tabs/Tabs.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TextArea from "../TextArea/TextArea.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { themes } from "../Theme/Theme.svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import { uniqueId } from "../utils/unique-id.js";
  import ThemeBuilderPreview from "./ThemeBuilderPreview.svelte";
  import ThemeBuilderToken from "./ThemeBuilderToken.svelte";
  import {
    checkContrast,
    decodeShare,
    encodeShare,
    fullTheme,
    isTheme,
    minimizeOverrides,
    parseTheme,
    previewStyle,
    resolveTheme,
    sanitizeTokens,
    toCss,
    toDtcg,
    TOKEN_GROUPS,
    TOKEN_NAMES,
    tokensByGroup,
    toScss,
  } from "./theme-model.js";

  const dispatch = createEventDispatcher();
  const groups = tokensByGroup();
  const THROTTLE_MS = 1000;
  $: headingId = `${id}-contrast`;

  let filter = "";
  let showPasses = false;
  let onlyChanged = true;
  let importText = "";
  /** @type {string[]} */
  let importInvalid = [];
  let importApplied = false;
  let origin = "";
  let announced = "";
  let announcedAt = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let announceTimer;
  let ready = false;

  /** @type {{ base: string; tokens: Record<string, string>; derive: boolean }} */
  let stored = { base, tokens, derive };

  $: result = resolveTheme(isTheme(base) ? base : "white", tokens, { derive });
  $: resolved = result.tokens;
  $: theme = isTheme(base) ? base : "white";
  $: all = fullTheme(theme, resolved);
  $: style = previewStyle(resolved);
  $: changedCount = Object.keys(resolved).length;
  $: overrideCount = Object.keys(tokens).length;

  $: contrast = hideContrast ? [] : checkContrast(theme, resolved);
  $: failing = contrast.filter((r) => r.status === "fail");
  $: inherited = contrast.filter((r) => r.status === "base-fail");
  $: rows = showPasses
    ? [...failing, ...inherited, ...contrast.filter((r) => r.status === "pass")]
    : [...failing, ...inherited];
  $: summary =
    failing.length === 0
      ? inherited.length === 0
        ? `All ${contrast.length} token pairs meet WCAG AA.`
        : `No new contrast failures. ${inherited.length} already ${inherited.length === 1 ? "fails" : "fail"} in ${themes[theme]}.`
      : `${failing.length} token ${failing.length === 1 ? "pair fails" : "pairs fail"} WCAG AA.${
          inherited.length
            ? ` ${inherited.length} more already ${inherited.length === 1 ? "fails" : "fail"} in ${themes[theme]}.`
            : ""
        }`;

  // The visible summary is a live region. Throttle it so dragging a color
  // announces at most once a second, and the last state always lands.
  $: announce(summary);

  /** @param {string} text */
  function announce(text) {
    if (typeof window === "undefined" || announcedAt === 0) {
      announced = text;
      announcedAt = typeof window === "undefined" ? 0 : Date.now();
      return;
    }
    clearTimeout(announceTimer);
    const wait = THROTTLE_MS - (Date.now() - announcedAt);
    if (wait <= 0) {
      announced = text;
      announcedAt = Date.now();
    } else {
      announceTimer = setTimeout(() => {
        announced = text;
        announcedAt = Date.now();
      }, wait);
    }
  }

  $: needle = filter.trim().toLowerCase();
  $: matches = needle
    ? TOKEN_NAMES.filter((token) => token.includes(needle)).slice(0, 60)
    : [];

  $: shareHash = encodeShare(theme, tokens);
  $: shareUrl = origin ? `${origin}#${shareHash}` : `#${shareHash}`;

  // Only the open format is built, so an edit does not rebuild three
  // exports of up to 250 tokens that nobody is reading.
  let exportTab = 0;
  $: cssText =
    exportTab === 0 ? toCss(onlyChanged ? resolved : all, { selector }) : "";
  $: scssText = exportTab === 1 ? toScss(theme, resolved) : "";
  $: jsonText =
    exportTab === 2
      ? JSON.stringify(toDtcg(theme, onlyChanged ? resolved : all), null, 2)
      : "";

  // `all` is a parameter so the template reruns this when the theme changes.
  /**
   * @param {Record<string, string>} values
   * @param {string} token
   * @returns {string}
   */
  function shownValue(values, token) {
    let value = values[token] ?? "";
    for (let hops = 0; hops < 4 && value.startsWith("var(--cds-"); hops++) {
      value = values[value.slice(10, -1)] ?? "";
    }
    return value;
  }

  function emit() {
    stored = { base, tokens, derive };
    dispatch("change", { base, tokens, resolved });
  }

  /** @param {CustomEvent<{ token: string; value: string }>} event */
  function setToken(event) {
    const { token, value } = event.detail;
    tokens = { ...tokens, [token]: value };
    emit();
  }

  /** @param {CustomEvent<{ token: string }>} event */
  function resetToken(event) {
    const { [event.detail.token]: _removed, ...rest } = tokens;
    tokens = rest;
    emit();
  }

  function resetAll() {
    tokens = {};
    emit();
  }

  /** @param {CustomEvent<string>} event */
  function onBase(event) {
    const next = event.detail;
    if (!isTheme(next)) return;
    base = next;
    emit();
  }

  /** @param {CustomEvent<{ toggled: boolean }>} event */
  function onDerive(event) {
    derive = event.detail.toggled;
    emit();
  }

  function applyImport() {
    const parsed = parseTheme(importText);
    importInvalid = parsed.invalid;
    importApplied = Object.keys(parsed.tokens).length > 0;
    if (!importApplied) return;
    if (parsed.base) base = parsed.base;
    // Keep only what is not derivable, so a pasted export stays editable.
    tokens = minimizeOverrides(parsed.base ?? theme, parsed.tokens, derive);
    emit();
  }

  /**
   * Apply a stored or shared theme. Anything unsafe is dropped.
   * @param {{ base?: unknown; tokens?: unknown; derive?: unknown } | undefined | null} next
   */
  function restore(next) {
    if (!next || typeof next !== "object") return;
    const nextBase =
      typeof next.base === "string" && isTheme(next.base) ? next.base : base;
    const nextTokens = sanitizeTokens(next.tokens).tokens;
    const nextDerive = typeof next.derive === "boolean" ? next.derive : derive;
    if (
      nextBase === base &&
      nextDerive === derive &&
      JSON.stringify(nextTokens) === JSON.stringify(tokens)
    ) {
      return;
    }
    base = nextBase;
    tokens = nextTokens;
    derive = nextDerive;
    dispatch("change", {
      base,
      tokens,
      resolved: resolveTheme(nextBase, nextTokens, { derive }).tokens,
    });
  }

  $: if (persist && ready) restore(stored);

  onMount(() => {
    origin = `${window.location.origin}${window.location.pathname}`;
    if (readHash) {
      const shared = decodeShare(window.location.hash);
      if (shared) restore({ base: shared.base, tokens: shared.tokens });
    }
    ready = true;
    return () => clearTimeout(announceTimer);
  });

  /** @param {number} value */
  const ratioText = (value) =>
    `${(Math.floor(value * 100) / 100).toFixed(2)}:1`;
</script>

{#if persist}
  <LocalStorage key={persistKey} bind:value={stored} />
{/if}

<div
  {id}
  role="group"
  aria-label="Theme builder"
  {...$$restProps}
  class={["bx--theme-builder", $$restProps.class].filter(Boolean).join(" ")}
>
  <div class="bx--theme-builder__toolbar">
    <Select
      id="{id}-base"
      size="sm"
      labelText="Base theme"
      selected={theme}
      on:update={onBase}
    >
      {#each Object.entries(themes) as [key, text] (key)}
        <SelectItem value={key} {text} />
      {/each}
    </Select>
    <Toggle
      id="{id}-derive"
      size="sm"
      labelText="Derive related tokens"
      labelA="Off"
      labelB="On"
      toggled={derive}
      on:toggle={onDerive}
    />
    <Button
      size="sm"
      kind="tertiary"
      disabled={overrideCount === 0}
      on:click={resetAll}
    >
      Reset all
    </Button>
    <p class="bx--theme-builder__count">
      {overrideCount}
      {overrideCount === 1 ? "token" : "tokens"} edited, {changedCount} changed
    </p>
  </div>

  <div class="bx--theme-builder__main">
    <section class="bx--theme-builder__editor" aria-label="Token editor">
      <TextInput
        id="{id}-filter"
        size="sm"
        labelText="Filter tokens"
        placeholder="layer, button-primary, tag"
        bind:value={filter}
      />
      {#if needle}
        <div class="bx--theme-builder__list" role="list">
          {#each matches as token (token)}
            <div role="listitem">
              <ThemeBuilderToken
                id="{id}-{token}"
                {token}
                value={all[token]}
                shown={shownValue(all, token)}
                source={result.sources[token]}
                on:change={setToken}
                on:reset={resetToken}
              />
            </div>
          {:else}
            <p class="bx--theme-builder__empty">No token matches "{filter}".</p>
          {/each}
        </div>
      {:else}
        <Accordion size="sm">
          {#each TOKEN_GROUPS as group (group.id)}
            <AccordionItem
              id="{id}-group-{group.id}"
              lazy
              open={group.id === "interactive"}
              title="{group.label} ({groups[group.id].length})"
            >
              <p class="bx--theme-builder__group-help">{group.description}</p>
              <div class="bx--theme-builder__list" role="list">
                {#each groups[group.id] as token (token)}
                  <div role="listitem">
                    <ThemeBuilderToken
                      id="{id}-{token}"
                      {token}
                      value={all[token]}
                      shown={shownValue(all, token)}
                      source={result.sources[token]}
                      on:change={setToken}
                      on:reset={resetToken}
                    />
                  </div>
                {/each}
              </div>
            </AccordionItem>
          {/each}
        </Accordion>
      {/if}
    </section>

    <section class="bx--theme-builder__preview" aria-label="Preview">
      <slot name="preview" {theme} {style} {resolved}>
        <ThemeBuilderPreview {id} {theme} {style} />
      </slot>
      <p class="bx--theme-builder__forced-note">
        Forced colors is on. The browser replaces theme colors with system
        colors, so the preview does not show your tokens. The exported theme is
        unchanged.
      </p>
    </section>
  </div>

  {#if !hideContrast}
    <section class="bx--theme-builder__contrast" aria-labelledby={headingId}>
      <h3 id={headingId} class="bx--theme-builder__heading">Contrast</h3>
      <p role="status" class="bx--theme-builder__summary">{announced}</p>
      <Checkbox
        id="{id}-passes"
        bind:checked={showPasses}
        labelText="Show passing pairs"
      />
      {#if rows.length > 0}
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
          class="bx--theme-builder__table-wrap"
          role="region"
          aria-label="Contrast results"
          tabindex="0"
        >
          <table class="bx--theme-builder__table">
            <thead>
              <tr>
                <th scope="col">Pair</th>
                <th scope="col">Ratio</th>
                <th scope="col">Needs</th>
                <th scope="col">APCA Lc</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {#each rows as row (`${row.fg}|${row.bg}`)}
                <tr>
                  <th scope="row">
                    <code>{row.fg}</code> on <code>{row.bg}</code>
                  </th>
                  <td>{ratioText(row.ratio)}</td>
                  <td>{row.min}:1 {row.use === "text" ? "text" : "non-text"}</td
                  >
                  <td>{Math.abs(row.lc).toFixed(0)}</td>
                  <td>
                    <Tag
                      id="{id}-result-{row.fg}-{row.bg}"
                      size="sm"
                      type={row.status === "pass"
                        ? "green"
                        : row.status === "fail"
                          ? "red"
                          : "gray"}
                    >
                      {row.status === "pass"
                        ? "Pass"
                        : row.status === "fail"
                          ? "Fail"
                          : "Fails in base"}
                    </Tag>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
      <p class="bx--theme-builder__note">
        Ratios use WCAG 2.2 AA: 4.5:1 for text, 3:1 for icons, borders, and
        focus. APCA Lc is advisory: about 75 for body text and 60 for large text
        is a common target. WCAG 2 is still the conformance baseline.
      </p>
    </section>
  {/if}

  {#if !hideExport}
    <section class="bx--theme-builder__export" aria-label="Export and import">
      <h3 class="bx--theme-builder__heading">Export</h3>
      <Tabs aria-label="Export format" bind:selected={exportTab}>
        <Tab id="{id}-tab-css" label="CSS" />
        <Tab id="{id}-tab-sass" label="Sass" />
        <Tab id="{id}-tab-json" label="JSON" />
        <Tab id="{id}-tab-import" label="Import" />
        <svelte:fragment slot="content">
          <TabContent id="{id}-panel-css">
            <div class="bx--theme-builder__options">
              <TextInput
                id="{id}-selector"
                size="sm"
                labelText="Selector"
                bind:value={selector}
              />
              <Checkbox
                id="{id}-changed"
                bind:checked={onlyChanged}
                labelText="Only changed tokens"
              />
            </div>
            {#if exportTab === 0}<CodeSnippet
                id="{id}-css"
                type="multi"
                code={cssText}
              />{/if}
          </TabContent>
          <TabContent id="{id}-panel-sass">
            {#if exportTab === 1}<CodeSnippet
                id="{id}-sass"
                type="multi"
                code={scssText}
              />{/if}
          </TabContent>
          <TabContent id="{id}-panel-json">
            {#if exportTab === 2}<CodeSnippet
                id="{id}-json"
                type="multi"
                code={jsonText}
              />{/if}
          </TabContent>
          <TabContent id="{id}-panel-import">
            <TextArea
              id="{id}-import"
              labelText="Paste CSS custom properties or JSON"
              helperText="Accepts --cds-* declarations, a token map, or Design Tokens JSON."
              rows={6}
              bind:value={importText}
            />
            <Button
              size="sm"
              disabled={!importText.trim()}
              on:click={applyImport}
            >
              Apply
            </Button>
            {#if importInvalid.length > 0}
              <InlineNotification
                lowContrast
                kind="warning"
                hideCloseButton
                title="Skipped"
                subtitle="{importInvalid.length} {importInvalid.length === 1
                  ? 'entry'
                  : 'entries'} named no token or held a value the builder does not accept: {importInvalid
                  .slice(0, 5)
                  .join(', ')}"
              />
            {:else if importApplied}
              <p class="bx--theme-builder__note">Imported.</p>
            {/if}
          </TabContent>
        </svelte:fragment>
      </Tabs>
      <CopyInput id="{id}-share" labelText="Share link" value={shareUrl} />
    </section>
  {/if}
</div>
