<script lang="ts">
  import TextAnnotations from "carbon-components-svelte/TextAnnotations/TextAnnotations.svelte";

  const params = new URLSearchParams(location.search);
  const large = params.has("large");
  const bidi = params.has("bidi");
  const plain = params.has("text");
  const scroll = params.has("scroll");
  const highlight = (params.get("highlight") ?? "auto") as
    "auto" | "highlight-api" | "mark";

  const CLAUSES = [
    [
      "1. Term. ",
      "This Agreement begins on the ",
      "Effective Date",
      " and continues for twelve months unless ended earlier under clause 4.",
    ],
    [
      "2. Fees. ",
      "The Customer shall pay the Supplier a ",
      "monthly fee of 4,200 euros",
      " within thirty days of invoice. Late payment carries interest at two percent a month.",
    ],
    [
      "3. Liability. ",
      "Neither party is liable for ",
      "indirect or consequential loss",
      " arising from this Agreement, and total liability is capped at the fees paid in the prior year.",
    ],
    [
      "4. Notice. ",
      "Either party may end this Agreement by giving ",
      "sixty days written notice",
      " to the other. Notice takes effect on the day it is received.",
    ],
  ];

  const ARABIC = [
    [
      "",
      "مرحبا بكم في ",
      "اتفاقية الخدمة",
      " بين الطرفين، وتسري من تاريخ التوقيع.",
    ],
    [
      "",
      "Payment is due within ",
      "thirty days of invoice",
      " (الدفع خلال ثلاثين يوما من تاريخ الفاتورة).",
    ],
  ];

  const WORDS =
    "the parties agree that each obligation under this schedule survives termination and binds successors assigns and affiliates".split(
      " ",
    );

  function paragraphs(): string[][] {
    if (bidi) return ARABIC;
    if (!large) return CLAUSES;
    // About 20,000 words: 400 paragraphs of 50, with one emphasized run each.
    return Array.from({ length: 400 }, (_, p) => {
      const words = Array.from(
        { length: 50 },
        (_, w) =>
          `${WORDS[(p * 7 + w * 3) % WORDS.length]}${w === 0 || w === 20 ? p : ""}`,
      );
      return [
        `${p + 1}. `,
        `${words.slice(0, 20).join(" ")} `,
        words.slice(20, 26).join(" "),
        ` ${words.slice(26).join(" ")}.`,
      ];
    });
  }

  const rows = paragraphs();
  const docText = rows.map((row) => row.join("")).join("");
  const html = rows
    .map(
      ([a, b, c, d]) =>
        `<p${bidi ? ' dir="auto"' : ""}>${a}${b}<em>${c}</em>${d}</p>`,
    )
    .join("");

  function find(quote: string, from = 0) {
    const start = docText.indexOf(quote, from);
    return { start, end: start + quote.length };
  }

  function make(id: string, quote: string, author: string, body: string) {
    const range = find(quote);
    return {
      id,
      range,
      quote,
      prefix: docText.slice(Math.max(0, range.start - 32), range.start),
      suffix: docText.slice(range.end, range.end + 32),
      comments: [{ id: `${id}-1`, author: { name: author }, body }],
    };
  }

  function initial() {
    if (large) {
      const out = [];
      for (let i = 0; i < 200; i++) {
        const row = rows[(i * 2) % rows.length];
        out.push(
          make(
            `n${i}`,
            row[2],
            i % 2 ? "Ada Lovelace" : "Grace Hopper",
            `Note ${i}: confirm this obligation survives termination.`,
          ),
        );
      }
      return out;
    }
    if (bidi) {
      return [
        make("b1", "اتفاقية الخدمة", "Ada Lovelace", "Check the Arabic title."),
        make("b2", "thirty days of invoice", "Grace Hopper", "Net 30."),
      ];
    }
    return [
      make("c1", "Effective Date", "Ada Lovelace", "Define this term."),
      make(
        "c2",
        "monthly fee of 4,200 euros",
        "Grace Hopper",
        "Is this fee fixed or indexed?",
      ),
      {
        ...make(
          "c3",
          "fee of 4,200 euros within thirty days",
          "Alan Turing",
          "Net 30 is short for a public body.",
        ),
        comments: [
          {
            id: "c3-1",
            author: { name: "Alan Turing" },
            body: "Net 30 is short for a public body.",
          },
          {
            id: "c3-2",
            author: { name: "Grace Hopper" },
            body: "Agreed. Ask for 45.",
          },
        ],
      },
      make(
        "c4",
        "indirect or consequential loss",
        "Alan Turing",
        "Carve out data breach?",
      ),
      make("c5", "sixty days written notice", "Ada Lovelace", "Thirty days?"),
    ];
  }

  let annotations = initial();
  let activeId: string | null = null;
  let events: string[] = [];

  function log(name: string, detail: unknown) {
    events = [...events, `${name}:${JSON.stringify(detail)}`];
  }

  (window as unknown as Record<string, unknown>).__annotations = () =>
    annotations;
</script>

<div data-testid="host">
  {#if plain}
    <TextAnnotations
      bind:annotations
      bind:activeId
      {highlight}
      labelText="Service agreement"
      user={{ id: "u1", name: "Ada Lovelace" }}
      text={docText}
      height={scroll ? 360 : undefined}
      on:create={(e) => log("create", e.detail.annotation.quote)}
      on:reply={(e) => log("reply", e.detail.comment.body)}
      on:remove={(e) => log("remove", e.detail.annotation.id)}
      on:reanchor={(e) => log("reanchor", e.detail.changes)}
    />
  {:else}
    <TextAnnotations
      bind:annotations
      bind:activeId
      {highlight}
      labelText="Service agreement"
      user={{ id: "u1", name: "Ada Lovelace" }}
      height={scroll ? 360 : undefined}
      on:create={(e) => log("create", e.detail.annotation.quote)}
      on:reply={(e) => log("reply", e.detail.comment.body)}
      on:remove={(e) => log("remove", e.detail.annotation.id)}
      on:reanchor={(e) => log("reanchor", e.detail.changes)}
    >
      <div data-testid="content">{@html html}</div>
    </TextAnnotations>
  {/if}
  <output class="bx--visually-hidden" data-testid="events"
    >{events.join("|")}</output
  >
  <output class="bx--visually-hidden" data-testid="active"
    >{activeId ?? ""}</output
  >
  <output class="bx--visually-hidden" data-testid="count"
    >{annotations.length}</output
  >
</div>
