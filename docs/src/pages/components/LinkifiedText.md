---
components: ["LinkifiedText"]
description: LinkifiedText turns the URLs and email addresses in untrusted plain text, such as a chat message, into safe links, and leaves everything else as text.
keywords: ["autolink", "linkify", "sanitize", "XSS", "chat message", "user generated content"]
---

<script>
  import { LinkifiedText, Stack, displayHref, linkLabel, safeUrl } from "carbon-components-svelte";

  const message = "Your parcel is on its way: https://shipping.example.com/track/1Z999AA1. Questions? Write to support@example.com or see www.example.com/help (open 9 to 5).";
  const hostile = 'Click <a href="javascript:alert(1)">here</a>, or javascript://%0Aalert(1), or data://text/html,hi, or https://paypal.com@evil.example/';
  const hebrew = "שלום, הנה הקישור https://example.com/docs. תודה!";
  const results = [
    ['safeUrl("HTTPS://Example.com/A")', safeUrl("HTTPS://Example.com/A")],
    ['safeUrl("javascript:alert(1)")', safeUrl("javascript:alert(1)")],
    ['safeUrl("java\\tscript:alert(1)")', safeUrl("java\tscript:alert(1)")],
    ['safeUrl("//evil.example")', safeUrl("//evil.example", { allowRelative: true })],
    ['displayHref("https://аррӏе.com/login")', displayHref("https://аррӏе.com/login")],
    ['linkLabel("paypal.com", "https://evil.example/").mismatch', linkLabel("paypal.com", "https://evil.example/").mismatch],
  ].map(([call, result]) => [call, JSON.stringify(result)]);
  const lookalike = "Log in at https://аррӏе.com/login (the first letters are Cyrillic).";
</script>

## Basic

`LinkifiedText` renders `text` as text. Each `http`, `https` and `mailto` URL in it, each `www.` address and each email address becomes a link, and nothing else changes: it never builds HTML, so a `<script>` in `text` shows as the characters `<script>`. Punctuation that ends a sentence stays outside the link, and so does a closing bracket the URL didn't open.

<LinkifiedText text={message} />

## Untrusted text

Text from users, from a model or from another system can carry anything. `javascript:`, `data:` and `vbscript:` URLs, markup and links with credentials stay plain text, and a link never shows a name other than its address.

<LinkifiedText text={hostile} />

| Do | Why |
| :--- | :--- |
| Render untrusted text with `LinkifiedText` or `{text}` | Both treat it as text, so nothing in it can run as markup. |
| Never pass it to `{@html}` unchanged | Svelte doesn't sanitize `{@html}`, and an assistant can repeat HTML injected into a page it read. |
| Run a URL you must put in `href` yourself through `safeUrl` | Svelte doesn't block `javascript:` URLs in attributes. |
| Keep the `rel` that `LinkifiedText` sets | The destination can't reach back into your page or see where the visitor came from. |

## Opening links in a new tab

Set `target="_blank"` to open links in a new tab. The default `rel`, `"noopener noreferrer nofollow"`, stays, so the new page can't use `window.opener` and search engines don't follow the link.

<LinkifiedText text="Read https://example.com/terms first." target="_blank" />

## Protocols and email

Set `protocols` to choose the schemes that become links, with or without the colon: `["https"]` links only `https`, and `["https", "tel"]` also links `tel:+15550100`. `javascript:`, `vbscript:` and `data:` are never linked, even if listed. Set `emails` to `false` to leave bare email addresses as text.

<Stack gap={3}>
  <LinkifiedText text="Call tel:+15550100 or see http://example.com or https://example.com" protocols={["https", "tel"]} />
  <LinkifiedText text="Write to support@example.com" emails={false} />
</Stack>

## Right-to-left text

Each link is isolated from the text around it, because its direction is always left to right, so a URL in Hebrew or Arabic text keeps its characters in order and the sentence's punctuation doesn't jump inside the address. Set `dir` on the component to give the text its direction, or `dir="auto"` when you don't know it, such as for a chat message: the text then follows its first strong letter. A URL that isn't linked is plain text, and an address in right-to-left text can show its slash or full stop on the wrong side.

<LinkifiedText text={hebrew} dir="rtl" />

## Look-alike addresses

A link whose host is written in letters that mimic Latin ones (here, Cyrillic) shows the address it really goes to, in punycode, not the look-alike. A host in one honest script, such as `bücher.de` or a Japanese domain, shows as written.

<LinkifiedText text={lookalike} />

## Utilities

The component is built from functions that are exported on their own, for text you render some other way.

| Function | Use |
| :--- | :--- |
| `safeUrl(url, options)` | Returns the URL to put in `href`, normalized, or `null`. `options` are `protocols`, `allowRelative`, `allowCredentials` and `maxLength`. |
| `linkify(text, options)` | Splits text into `{ type: "text" }` and `{ type: "link", text, href }` segments. |
| `displayHref(href)` | The address a link goes to, in a form a reader can trust, such as `example.com/a/b`. |
| `linkLabel(text, href)` | Checks a link's text against its address. `mismatch` is `true` when the text names another site. |
| `sanitizeHtml(html, options)` | Reduces HTML to an allowlist. For when you can't avoid HTML. |
| `htmlToText(html)` | The text of some HTML, with the markup removed. |

```svelte
<script>
  import { Link, displayHref, linkLabel, linkify } from "carbon-components-svelte";

  const text = "Docs: https://example.com/docs";
</script>

{#each linkify(text) as part}
  {#if part.type === "link"}
    <Link href={part.href}>{part.text}</Link>
  {:else}
    {part.text}
  {/if}
{/each}
```

`safeUrl` reads a URL as a browser does, so `java\tscript:alert(1)`, `JAVASCRIPT:` and a leading control character are all caught by their scheme. A relative URL needs `allowRelative`, and `//host` and `\\host` are never accepted.

<Stack gap={2}>
  {#each results as [call, result]}
    <div><code>{call}</code> returns <code>{result}</code></div>
  {/each}
</Stack>

## HTML

Use `sanitizeHtml` only for HTML you can't turn into text first, such as the output of a rich text editor. It reads the string with its own tokenizer, not the browser's, and writes new markup from an allowlist, so it gives the same result on the server and in the browser, and no browser parsing quirk can turn its output into a script. By default it keeps text, heading, list and link tags; every link gets `rel="noopener noreferrer nofollow"`. Pass `allow` to change `tags`, `attributes` (`*` for every tag), `protocols` or `allowRelative`.

```js
import { sanitizeHtml } from "carbon-components-svelte";

sanitizeHtml('<p onclick="x()">Hi <a href="javascript:x()">there</a><script>x()</script></p>');
// "<p>Hi there</p>"

sanitizeHtml('<span class="note">Hi</span>', {
  allow: { tags: ["span"], attributes: { span: ["class"] } },
});
// '<span class="note">Hi</span>'
```

Scripts, styles, frames, `svg`, `math` and `template` are always dropped with their content, and so are `on*`, `style` and `srcdoc` attributes, whatever `allow` says.

## Limits

Every function takes any string and never throws. Cost is linear in the length of the text: a million characters of any shape takes milliseconds, not seconds. A link longer than 2,048 characters (`maxLength`) stays text, and `sanitizeHtml` reads the first million characters of its input.

| Not covered | Instead |
| :--- | :--- |
| Bare domains without `www.` or a scheme, such as `example.com` | Add the scheme before you render, or write the link by hand. Telling `example.com` from `index.html` takes a list of top-level domains. |
| Markdown, mentions and formatting | Render the blocks yourself; `LinkifiedText` only finds addresses. |
| Whether the destination is safe to visit | Link scanning and reputation need a service. |
| Whole-script confusables beyond Cyrillic, Greek and a few others | `displayHref` shows the punycode form of the hosts it doubts; it is not a full UTS 39 check. |
| HTML that must keep classes, styles or images | Allow only what you need with `allow`, and load images from your own host. |
