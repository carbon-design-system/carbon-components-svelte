<script>
  import { RichTextEditor } from "carbon-components-svelte";

  const shape = new URLSearchParams(location.search).get("shape") ?? "blocks";
  const words = Array.from(
    { length: 10 },
    (_, i) =>
      [
        "alpha",
        "bravo",
        "charlie",
        "delta",
        "echo",
        "foxtrot",
        "golf",
        "hotel",
        "india",
        "juliet",
      ][i],
  );
  const sentence = (n) =>
    Array.from({ length: n }, (_, i) => words[(i * 7 + n) % words.length]).join(
      " ",
    );

  function build() {
    // About 10,000 words in each shape.
    if (shape === "small") return `<p>${sentence(100)}</p>`;
    if (shape === "single") return `<p>${sentence(10000)}</p>`;
    if (shape === "list") {
      return `<ul>${Array.from({ length: 500 }, (_, i) => `<li>${sentence(20)} <strong>${i}</strong></li>`).join("")}</ul>`;
    }
    return Array.from({ length: 500 }, (_, i) =>
      i % 25 === 0
        ? `<h2>Section ${i / 25}</h2>`
        : `<p>${sentence(10)} <strong>${sentence(3)}</strong> <em>${sentence(3)}</em> <a href="https://example.com/${i}">${sentence(2)}</a> ${sentence(2)}</p>`,
    ).join("");
  }

  let value = build();
</script>

<RichTextEditor labelText="Long" bind:value rows={20} maxRows={20} />
<div data-testid="length">{value.length}</div>
