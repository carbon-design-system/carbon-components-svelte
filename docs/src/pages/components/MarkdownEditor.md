---
components: ["MarkdownEditor"]
description: Markdown editors provide a multi-line field for writing Markdown, with a live preview and a toolbar that formats the selection.
---

<script>
  import { Box, FluidForm, MarkdownEditor } from "carbon-components-svelte";
</script>

## Basic

`MarkdownEditor` is a textarea with a header of **Write** and **Preview** tabs and a formatting toolbar. Bind `value` to the Markdown, as with [TextArea](/components/TextArea). Toolbar buttons and shortcuts transform the selection: they wrap it, unwrap it, or prefix its lines, and leave the result selected, so pressing one twice undoes it.

The preview is drawn from a parse of the text, never from HTML. Raw HTML shows as text, an image becomes a link, and a link whose address is not `http:`, `https:` or `mailto:` shows as plain text. Load `css/prose.css` for the preview's type; the preview is a [Prose](/components/Prose).

<MarkdownEditor
  labelText="Release notes"
  helperText="Supports Markdown"
  value={"## What changed\n\n- Faster **builds**\n- A new [docs site](https://example.com)\n"}
/>

## Views

### Tabs

The Write and Preview tabs are a tab list with arrow-key navigation. Bind `view` to read or set the tab. The textarea stays in the page while Preview shows, so a form still submits it.

<FileSource src="/framed/MarkdownEditor/MarkdownEditorViews" />

### Split view

Set `split` to show the text and its preview side by side when the editor is `splitMinWidth` wide (default 640 pixels) or more. The editor's own width counts, not the window's, so an editor in a narrow column keeps its tabs. Bind `splitActive` to read which layout shows.

The side-by-side preview waits `previewDelay` milliseconds (default 150) after typing pauses before it draws again. The Preview tab draws at once.

<FileSource src="/framed/MarkdownEditor/MarkdownEditorSplit" />

## Toolbar

Set `toolbar` to the actions to show, in order: `"heading"`, `"bold"`, `"italic"`, `"strikethrough"`, `"quote"`, `"code"`, `"link"`, `"ul"`, `"ol"` and `"task"`. Set it to `[]` to leave the toolbar out; the keyboard shortcuts still work.

<MarkdownEditor
  labelText="Comment"
  toolbar={["bold", "italic", "link"]}
  value="Short comments need only a few tools."
/>

The toolbar is a single tab stop. <DocKbd label="Left" /> and <DocKbd label="Right" /> move along it (mirrored in right-to-left), and <DocKbd label="Home" /> and <DocKbd label="End" /> jump to its ends. Pressing a button, or its shortcut, returns focus to the textarea.

### What each action does

| Action | With a selection | At a caret |
| :--- | :--- | :--- |
| Bold, italic, strikethrough | Wraps the selection, or takes the markers off when they are there | Wraps the word, or inserts a pair of markers between words |
| Code | Inline code, or a fenced block when the selection spans lines | Wraps the word |
| Link | Selects the address to type over; a selected address becomes the target | Wraps the word |
| Heading | Toggles `toolbarHeadingLevel` (default `###`) on the line | Same |
| Quote, lists, task list | Prefixes every selected line, or removes the prefix when every line has it | Same, on the line |

Selected spaces stay outside the markers, since a marker beside a space does not format. Inside a fenced code block the line actions do nothing.

### Shortcuts

`shortcuts` maps an action to a shortcut, as [Kbd](/components/Kbd) takes it. By default <DocKbd label="mod+B" /> bolds, <DocKbd label="mod+I" /> italicizes, and <DocKbd label="mod+K" /> links. They work while the textarea has focus, not elsewhere on the page, and each shows in its button's tooltip and in `aria-keyshortcuts`.

<MarkdownEditor
  labelText="Notes"
  shortcuts={{ bold: "mod+b", italic: "mod+i", link: "mod+k", code: "mod+e", strikethrough: "mod+shift+x" }}
  value="Hover a button to see its keys."
/>

## Lists

<DocKbd label="Enter" /> at the end of a list item or quote line starts the next one with the same marker: numbered lists count up and task lists open an empty box. On an empty item it ends the list, or moves a nested item out one level. <DocKbd label="Shift+Enter" /> breaks the line as it is.

<DocKbd label="Tab" /> and <DocKbd label="Shift+Tab" /> nest and un-nest the selected list items. Anywhere else, Tab moves focus as in any field. In a list, press <DocKbd label="Escape" /> and then <DocKbd label="Tab" /> to move focus out; the editor announces this, and points the textarea at the same hint.

| Key | Where | Result |
| :--- | :--- | :--- |
| <DocKbd label="Enter" /> | End of a list item or quote | A new item with the same marker |
| <DocKbd label="Enter" /> | An empty item | Ends the list, or moves it out a level |
| <DocKbd label="Tab" /> | A list item | Nests the item under the one above |
| <DocKbd label="Shift+Tab" /> | A list item | Moves the item out a level |
| <DocKbd label="Escape" /> | A list item | Lets the next Tab move focus |
| <DocKbd label="Tab" /> | Any other line | Moves focus |

<MarkdownEditor
  labelText="Checklist"
  value={"- [ ] Write the notes\n- [x] Review them\n  - [ ] Ask for a second look\n"}
/>

## Undo

Every edit the editor makes goes through the browser's editing commands, so <DocKbd label="mod+Z" /> undoes a toolbar action in one step and <DocKbd label="mod+Shift+Z" /> redoes it, with the native undo history intact.

## Form states

### Character count

Set `maxCount` to limit the characters, as [TextArea](/components/TextArea#maximum-character-count) does. A toolbar action can take the text past the limit; the field is then marked invalid, and the count turns red, without rewriting the value.

<MarkdownEditor labelText="Summary" maxCount={120} value="Write a short summary." />

### Helper text, invalid and warning

<Box>
  <MarkdownEditor labelText="Notes" helperText="Markdown is supported" />
</Box>
<Box>
  <MarkdownEditor labelText="Notes" invalid invalidText="Notes are required" />
</Box>
<Box>
  <MarkdownEditor labelText="Notes" warn warnText="This is longer than most notes" value="A long note." />
</Box>

### Read-only and disabled

A read-only editor leaves out the toolbar and keeps the Preview tab. A disabled one is inert.

<Box>
  <MarkdownEditor labelText="Read only" readonly value={"# Read only\n\nYou can still preview this."} />
</Box>
<Box>
  <MarkdownEditor labelText="Disabled" disabled value="Disabled" />
</Box>

### In a form

Set `name` to submit the text. The editor follows the form's reset.

<FileSource src="/framed/MarkdownEditor/MarkdownEditorForm" />

### Fluid

Inside a [FluidForm](/components/FluidForm), or with `fluid`, the helper text is hidden and the messages sit inside the field.

<FluidForm>
  <MarkdownEditor labelText="Notes" value="Fluid" />
</FluidForm>

## Preview

### Links

`schemes` lists the link schemes the preview makes links of, with the colon. Links open in a new tab with `rel="noopener noreferrer nofollow"`; set `linkTarget` to change the target. Relative links, links with credentials, and addresses with hidden or bidirectional-control characters show as text.

### Custom preview

Fill the `preview` slot to draw the text with your own renderer, such as a pipeline you already sanitize. The slot receives the text the preview would draw.

<FileSource src="/framed/MarkdownEditor/MarkdownEditorPreviewSlot" />

### Heading levels

`headingLevel` is the level `#` draws as in the preview (default `2`), so the preview's headings sit under the page's. `##` is one level lower, down to `h6`.

## Localization

Pass `labels` to replace any text the editor shows or announces: the tab names, each button's name, the empty preview, and the Tab hint. Keys you leave out keep their English default.

<MarkdownEditor
  labelText="Notas"
  labels={{ write: "Escribir", preview: "Vista previa", toolbar: "Formato", bold: "Negrita", italic: "Cursiva", link: "Enlace", empty: "Nada que mostrar" }}
  value="Hola **mundo**"
/>

## Accessibility

The Write and Preview tabs are `role="tablist"`, with the textarea and the preview in the matching tab panels. The toolbar is `role="toolbar"` with one tab stop. Each button is named by its action and carries its shortcut in `aria-keyshortcuts`. In the split view the preview is a labelled region. The focus ring follows the keyboard, so a click in the preview's text leaves it plain.

An IME composition is left alone: no shortcut, button or Enter acts until it ends.

| Do | Why |
| :--- | :--- |
| Give the editor a `labelText` | The textarea is the field's accessible name |
| Keep the default toolbar for general writing | Authors find the formatting they know |
| Fill the `preview` slot only with sanitized output | The built-in preview never builds HTML; yours may |
| Keep `split` for wide containers | A narrow editor keeps tabs, which fit |
| Pass `labels` for each locale | The button names are the toolbar's only text |
