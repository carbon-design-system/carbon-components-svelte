<script>
  /**
   */

  /**
   * Specify the size of the dropdown field
   * @type {"sm" | "lg" | "xl"}
   */
  //export let size = undefined;

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  /** Specify the title text */
  export let titleText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the list box component */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify the placeholder text */
  export let placeholder = null;

  /** Specify the html
   * @type {string}
   */
  export let html = undefined;

  /** Specify the text
   * @type {string}
   */
  export let text = undefined;

  import { onMount } from "svelte";
  import { quill } from "./quill";

  console.log(invalidText);

  let toolbar = [
    [{ header: 1 }, { header: 2 }, "blockquote", "link", "image", "video"],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "ordered" }],
    [{ align: [] }],
    ["clean"],
  ];

  export let options = {
    modules: {
      toolbar,
    },
    theme: "snow",
    placeholder,
  };

  onMount(() => {
    let container = document.getElementById(id);
    if (invalid) {
      let style = "2px solid red";
      container.style["borderLeft"] = style;
      container.style["borderBottom"] = style;
      container.style["borderRight"] = style;
      let toolbar =
        container.parentNode.getElementsByClassName("ql-toolbar")[0];
      toolbar.style["borderLeft"] = style;
      toolbar.style["borderTop"] = style;
      toolbar.style["borderRight"] = style;
    }
  });

  const onTextChange = (event) => {
    html = event.detail.html;
    text = event.detail.text;
  };
</script>

{#if titleText}
  <label
    for="{id}"
    class:bx--label="{true}"
    class:bx--label--disabled="{disabled}"
    class:bx--visually-hidden="{hideLabel}"
  >
    {titleText}
  </label>
{/if}
{#if disabled}
  {@html html}
{:else}
  <div
    id="{id}"
    use:quill="{{ options, html }}"
    on:text-change="{onTextChange}"
  ></div>
{/if}
{#if invalid}
  <div class:bx--form-requirement="{true}">{invalidText}</div>
{/if}
{#if !invalid && warn}
  <div class:bx--form-requirement="{true}">{warnText}</div>
{/if}
{#if !invalid && !warn && helperText}
  <div
    class:bx--form__helper-text="{true}"
    class:bx--form__helper-text--disabled="{disabled}"
  >
    {helperText}
  </div>
{/if}
<div class:bx--form-requirement="{true}">{invalidText}</div>

<style>
  @import "https://cdn.quilljs.com/1.3.6/quill.snow.css";

  .ql-container--invalid {
    border: 2px solid red;
  }
</style>
