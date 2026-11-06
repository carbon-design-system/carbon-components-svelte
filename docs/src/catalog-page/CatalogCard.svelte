<script>
  /**
   * One catalog card: the whole card opens the item, and the card also has
   * its own buttons. The title is the card's only link; its `::after`
   * stretches over the card, and the buttons sit above it. Nothing is nested
   * inside the link, so a screen reader finds one link and two buttons.
   */
  import {
    Button,
    Card,
    CardAction,
    CardActions,
    CardBody,
    CardHeader,
    CardTitle,
    Link,
    Tag,
  } from "carbon-components-svelte";
  import Compare from "carbon-icons-svelte/lib/Compare.svelte";
  import Star from "carbon-icons-svelte/lib/Star.svelte";
  import StarFilled from "carbon-icons-svelte/lib/StarFilled.svelte";
  import { createEventDispatcher } from "svelte";
  import Highlight from "../../../src/Highlight/Highlight.svelte";
  import { matchText } from "../../../src/utils/text-match.js";
  import { textSnippet } from "../../../src/utils/text-snippet.js";

  /** @type {import("./catalog-data.js").CatalogItem} */
  export let item;

  /** What the reader searched for, to mark in the title and the snippet. */
  export let query = "";

  /** Where the card goes. */
  export let href = "#";

  export let favorite = false;
  export let compare = false;

  /** The longest description shown, in characters. */
  export let snippetLength = 120;

  const dispatch = createEventDispatcher();

  $: terms = query.trim();
  $: snippet = terms
    ? textSnippet(item.description, matchText(item.description, terms), {
        maxLength: snippetLength,
        context: 28,
      })
    : { text: item.description, ranges: [] };
</script>

<Card class="ccs-catalog-card">
  <CardHeader>
    <CardTitle titleTruncate={2}>
      <svelte:fragment slot="labelChildren">
        {item.provider}{item.verified ? " (verified)" : ""}
      </svelte:fragment>
      <!-- A link is a flex container, which drops the space beside each
           mark. The span makes the marked text one flex item. -->
      <Link {href} class="ccs-catalog-card__link"
        ><span><Highlight decorative text={item.name} query={terms} /></span
        ></Link
      >
    </CardTitle>
    <CardActions slot="actions">
      <CardAction>
        <Button
          kind="ghost"
          size="sm"
          icon={favorite ? StarFilled : Star}
          iconDescription="Favorite {item.name}"
          tooltipPosition="bottom"
          isSelected={favorite}
          on:click={() => dispatch("favorite", { item, favorite: !favorite })}
        />
      </CardAction>
      <CardAction>
        <Button
          kind="ghost"
          size="sm"
          icon={Compare}
          iconDescription="Compare {item.name}"
          tooltipPosition="bottom"
          isSelected={compare}
          on:click={() => dispatch("compare", { item, compare: !compare })}
        />
      </CardAction>
    </CardActions>
  </CardHeader>
  <CardBody>
    <p class="ccs-catalog-card__snippet" title={item.description}>
      <Highlight decorative text={snippet.text} ranges={snippet.ranges} />
    </p>
    <div class="ccs-catalog-card__meta">
      <Tag size="sm" type="gray">{item.type}</Tag>
      <Tag size="sm" type="outline">{item.pricing}</Tag>
      <span class="ccs-catalog-card__rating"
        >{item.rating.toFixed(1)} ({item.reviews.toLocaleString("en")})</span
      >
    </div>
  </CardBody>
</Card>

<style>
  /* The card is the link's containing block, and the link's pseudo-element
     covers it. */
  :global(.ccs-catalog-card) {
    position: relative;
    display: flex;
    flex-direction: column;
    block-size: 100%;
    inline-size: 100%;
  }

  :global(.ccs-catalog-card__link) {
    outline: none;
  }

  /* `.bx--card__header` is positioned, which would make it, not the card, the
     link's containing block. Its actions then hang from the card's corner. */
  :global(.ccs-catalog-card .bx--card__header) {
    position: static;
  }

  :global(.ccs-catalog-card__link)::after {
    position: absolute;
    content: "";
    inset: 0;
  }

  /* The ring goes on the whole card, where the click lands. */
  :global(.ccs-catalog-card__link):focus-visible::after {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  /* The buttons stay above the stretched link, so they can be pressed. */
  :global(.ccs-catalog-card .bx--card__actions) {
    z-index: 1;
  }

  /* Titles take two lines whether they need them or not, so the snippets of a
     row start at one height. */
  :global(.ccs-catalog-card .bx--card__header > .bx--card__title) {
    margin-block: var(--cds-spacing-05, 1rem) var(--cds-spacing-03, 0.25rem);
  }

  :global(.ccs-catalog-card .bx--card__title-text-row) {
    min-block-size: 2.25rem;
  }

  :global(.ccs-catalog-card .bx--card__body) {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding-block-start: 0;
  }

  .ccs-catalog-card__snippet {
    display: -webkit-box;
    overflow: hidden;
    color: var(--cds-text-secondary);
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .ccs-catalog-card__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-block-start: auto;
    padding-block-start: var(--cds-spacing-03, 0.25rem);
    gap: var(--cds-spacing-02, 0.25rem);
  }

  .ccs-catalog-card__rating {
    color: var(--cds-text-secondary);
    margin-inline-start: var(--cds-spacing-03, 0.25rem);
  }

  @media (any-hover: hover) {
    :global(.ccs-catalog-card):hover {
      background: var(--cds-layer-hover);
    }
  }

  @media (forced-colors: active) {
    /* The card has its own outline here. */
    :global(.ccs-catalog-card__link):focus-visible::after {
      outline-color: Highlight;
    }
  }
</style>
