---
components: ["TextAnnotations"]
description: TextAnnotations lets readers select a range of read-only text, such as a contract, a transcript or a log, and attach comments that stay with that text.
---

<script>
  import { TextAnnotations } from "carbon-components-svelte";

  const text =
    "The Supplier shall deliver the goods within thirty days of the order date. Payment is due sixty days after delivery.";

  const quote = "within thirty days of the order date";
  const start = text.indexOf(quote);

  const annotations = [
    {
      id: "delivery",
      range: { start, end: start + quote.length },
      quote,
      comments: [
        {
          id: "delivery-1",
          author: { name: "Grace Hopper" },
          body: "Thirty days from the order or from payment?",
        },
      ],
    },
  ];
</script>

## Basic

Put the read-only document in the default slot and bind `annotations`. Select text, then choose Comment beside the selection, to start a thread. Hover or focus highlighted text to read its comments, or choose a card in the margin rail.

<FileSource src="/framed/TextAnnotations/ContractReview" />

## Data

`annotations` is an array of objects. The component never changes an object you gave it: it assigns a new array when a thread is added, replied to or deleted.

| Field | Holds |
| --- | --- |
| `id` | A stable id, used to key the rail and to bind `activeId`. |
| `range` | `{ start, end }`, offsets into the text of the document: its text nodes, in order, with markup ignored. |
| `quote` | The text the range covered when the annotation was made. |
| `prefix`, `suffix` | Up to 32 characters of text before and after the quote. Optional, and set for you on new annotations. |
| `comments` | `{ id, author: { id?, name }, body, createdAt? }` in order. The first one starts the thread. |

Offsets count UTF-16 code units over the text nodes of the document, so `<em>`, `<a>` and other inline markup do not change them. Text inside `script`, `style` and any element with `data-ccs-annotation-ignore` is left out.

## Document

### Markup

Use the default slot for headings, paragraphs and inline markup. Set `dir="auto"` on each block when the document mixes scripts, such as Arabic and English, so each block reads in its own direction.

### Plain text

Set `text` for a transcript, a log excerpt or any plain string. Line breaks stay as written.

<FileSource src="/framed/TextAnnotations/TranscriptNotes" />

### Scrolling area

Set `height` to give the document and its rail one scroll area. Cards stay beside their text as it scrolls. Leave it unset to let the page scroll.

<FileSource src="/framed/TextAnnotations/LogExcerpt" />

## Anchors

Each annotation keeps its text with it. When the document changes, the component checks each annotation in turn: the stored offsets, then the quote elsewhere in the text (choosing the occurrence with the same `prefix` and `suffix`), then a close match to the quote. An annotation with no match is kept in the rail, marked, and is not highlighted.

`reanchor` fires with the annotations that moved, and `detail.changes` holds the new `range` and a `status` for each: `"moved"`, `"fuzzy"` or `"orphaned"`. Store the new ranges. The component does not write them back to `annotations`.

<FileSource src="/framed/TextAnnotations/EditedText" />

## Overlapping text

Two annotations can cover some of the same text. The shared stretch is drawn darker, and hovering it opens the thread with the narrowest range. The card lists the others under "Also on this text".

## Saving

`create` and `reply` fire before the list changes. Call `preventDefault()` to add the item yourself, for example after the server accepts it. `remove` works the same way.

<FileSource src="/framed/TextAnnotations/SaveToServer" />

## Read-only

Set `readonly` to show existing threads without letting anyone start or reply to one.

<TextAnnotations {annotations} {text} readonly labelText="Order terms" />

## Highlight technique

Annotated ranges are painted with the CSS Custom Highlight API where the browser has it, so the document's DOM is not touched. Elsewhere they are wrapped in `<mark>` elements. Set `highlight` to choose.

| Value | Behavior |
| --- | --- |
| `"auto"` | The Custom Highlight API when the browser has it, `<mark>` otherwise. |
| `"highlight-api"` | The Custom Highlight API, with `<mark>` where it is missing. |
| `"mark"` | Always `<mark>`. The component splits text nodes to wrap them and puts them back, so the content of the document must not change except through `text`. |

The Custom Highlight API paints only color, background and text decoration, and it cannot be focused or read by a screen reader. The margin rail is the way to reach every annotation.

## Keyboard

The document is a focusable region, and the rail is a list of buttons with one tab stop.

| Keys | Action |
| --- | --- |
| <DocKbd label="Shift" /> + arrow keys | With the document focused, select text. Add <DocKbd label="Ctrl" /> or <DocKbd label="Alt" /> to move by word. |
| <DocKbd label="Ctrl" /> + <DocKbd label="Alt" /> + <DocKbd label="M" /> (<DocKbd label="⌘" /> + <DocKbd label="⌥" /> + <DocKbd label="M" /> on Apple platforms) | Comment on the selected text. Set `shortcut` to change it. |
| <DocKbd label="Alt" /> + <DocKbd label="ArrowDown" /> or <DocKbd label="ArrowUp" /> | With the document focused, move to the next or previous annotation. Its text is selected and its thread opens. |
| <DocKbd label="Tab" /> | From the document, move into the open thread. |
| <DocKbd label="ArrowDown" />, <DocKbd label="ArrowUp" />, <DocKbd label="Home" />, <DocKbd label="End" /> | In the rail, move between annotations. |
| <DocKbd label="Enter" /> | On a rail card, scroll to its text and open the thread. |
| <DocKbd label="Ctrl" /> + <DocKbd label="Enter" /> | In a thread, send the comment. |
| <DocKbd label="Escape" /> | Close the thread. Focus returns to where it came from. |

Call `comment()` and `reveal(id)` on the component to start the same actions from your own toolbar.

## Usage

| Do | Why |
| --- | --- |
| Set `labelText` to name the document, such as "Master services agreement". | The document is a region, and screen readers announce it by this name. |
| Store the `range`, `quote`, `prefix` and `suffix` of each annotation. | An annotation found again after an edit needs the quote and its surroundings, not only the offsets. |
| Listen to `reanchor` and save the new ranges. | The next page load then starts from the right offsets and skips the search. |
| Keep annotations on text that readers cannot edit. | The text is a record. Anchors recover from small edits, but not from a rewrite. |
| Pass `user` so new comments name their author. | The default author is "You". |
| Use `Alt` and the arrow keys or the rail, not the pointer, in your own tests. | Highlights are painted, not elements, so there is nothing to click or focus on them. |

## Accessibility

Highlights painted with the Custom Highlight API are invisible to assistive technology, so the margin rail is the accessible list of annotations. Each rail button is named "Comment by Ada Lovelace on “the quote”", and its description holds the first comment and the reply count. Opening one scrolls to its text, selects it so the reader's position follows, and opens the thread, a non-modal dialog, which closes with <DocKbd label="Escape" />.

Override these strings with the `*Text` and `*Description` props, such as `annotationDescription`, `repliesText` and `helpText`.

On a window narrower than 672px the rail stacks below the document and a thread opens as a sheet along the bottom edge. Selected and overlapping text differ by an underline style as well as by color, so they stay apart in forced colors.
