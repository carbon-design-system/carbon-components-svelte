<script>
  import { WebTerminal } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const ESC = "\u001b";
  const MAX_DEPTH = 32;
  const MAX_LENGTH = 200;

  const CONSTANTS = { pi: Math.PI, e: Math.E };
  const FUNCTIONS = { sqrt: Math.sqrt, abs: Math.abs, round: Math.round };
  const OPERATORS = {
    "+": { precedence: 1, apply: (a, b) => a + b },
    "-": { precedence: 1, apply: (a, b) => a - b },
    "*": { precedence: 2, apply: (a, b) => a * b },
    "/": { precedence: 2, apply: (a, b) => a / b },
    "%": { precedence: 2, apply: (a, b) => a % b },
    "^": { precedence: 3, right: true, apply: (a, b) => a ** b },
  };

  let ans = 0;

  /**
   * Read and evaluate an arithmetic expression. Nothing here calls `eval` or
   * `Function`: the text is split into tokens, and each token is looked up in
   * the tables above.
   */
  function calculate(source) {
    if (source.length > MAX_LENGTH) throw new Error("expression too long");
    const tokens =
      source.match(/\d+\.?\d*|\.\d+|[A-Za-z_]+|[-+*/%^()]|\S/g) ?? [];
    let position = 0;

    const peek = () => tokens[position];
    const take = () => tokens[position++];

    function primary(depth) {
      if (depth > MAX_DEPTH) throw new Error("expression too deep");
      const token = take();
      if (token === undefined) throw new Error("unexpected end of expression");
      if (/^[\d.]/.test(token)) return Number(token);
      if (token === "-") return -primary(depth + 1);
      if (token === "(") {
        const value = expression(0, depth + 1);
        if (take() !== ")") throw new Error("missing )");
        return value;
      }
      if (token === "ans") return ans;
      if (Object.hasOwn(CONSTANTS, token)) return CONSTANTS[token];
      if (Object.hasOwn(FUNCTIONS, token)) {
        if (take() !== "(") throw new Error(`${token} needs (`);
        const value = expression(0, depth + 1);
        if (take() !== ")") throw new Error("missing )");
        return FUNCTIONS[token](value);
      }
      throw new Error(`unexpected "${token}"`);
    }

    function expression(minPrecedence, depth) {
      let left = primary(depth);
      for (;;) {
        const operator =
          OPERATORS[peek()] && Object.hasOwn(OPERATORS, peek()) ? peek() : null;
        if (!operator || OPERATORS[operator].precedence < minPrecedence)
          return left;
        take();
        const { precedence, right, apply } = OPERATORS[operator];
        left = apply(
          left,
          expression(right ? precedence : precedence + 1, depth + 1),
        );
      }
    }

    const value = expression(0, 0);
    if (position < tokens.length) throw new Error(`unexpected "${peek()}"`);
    return value;
  }

  function execute(command, { clear }) {
    const text = command.trim();
    if (text === "clear") return void clear();
    if (text === "help") {
      return [
        "Type a sum, such as 2 * (3 + 4), 2 ^ 10 or sqrt(2).",
        "ans is the last result; pi and e are constants.",
        "",
      ].join("\n");
    }
    if (text.startsWith("echo ")) return text.slice(5);
    ans = calculate(text);
    return `${ESC}[36m${Number.isInteger(ans) ? ans : ans.toPrecision(12).replace(/\.?0+$/, "")}${ESC}[39m`;
  }

  let terminal;

  onMount(() => {
    terminal.run("help");
  });
</script>

<WebTerminal
  bind:this={terminal}
  {execute}
  prompt=">"
  title="Calculator"
  labelText="Calculator output"
  height="16rem"
/>
