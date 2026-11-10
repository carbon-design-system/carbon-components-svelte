// @vitest-environment node
import type {
  FormulaCallNode,
  FormulaNode,
} from "../../src/FormulaInput/formula-lang.js";
import {
  escapeFieldName,
  isBareName,
  MAX_DIAGNOSTICS,
  parseFormula,
  tokenize,
} from "../../src/FormulaInput/formula-lang.js";

const codes = (source: string) =>
  parseFormula(source).diagnostics.map((d) => d.code);

const shape = (node: FormulaNode | null): unknown => {
  if (!node) return node;
  switch (node.type) {
    case "binary":
      return [node.op, shape(node.left), shape(node.right)];
    case "unary":
      return [node.op, shape(node.arg)];
    case "group":
      return ["()", shape(node.expr)];
    case "call":
      return [node.name, ...node.args.map(shape)];
    case "number":
    case "string":
    case "boolean":
      return node.value;
    default:
      return "name" in node ? node.name : node.type;
  }
};

const ast = (source: string) => shape(parseFormula(source).ast);

describe("tokenize", () => {
  it("covers every character, so the tokens join to the source", () => {
    const source = 'IF(a >= 1.5e3, "x\\"y", {my field}) @ é\n\t 😀';
    const tokens = tokenize(source);

    expect(tokens.map((t) => source.slice(t.start, t.end)).join("")).toBe(
      source,
    );
    expect(tokens[0].start).toBe(0);
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i].start).toBe(tokens[i - 1].end);
    }
  });

  it("decodes strings, fields and numbers", () => {
    const [str, , field, , num] = tokenize('"a\\"b\\n" {x\\}y} 1.0');

    expect(str.value).toBe('a"b\n');
    expect(field.value).toBe("x}y");
    expect(num.value).toBe(1);
  });

  it("reads numbers with a fraction and an exponent", () => {
    const values = ["12", "1.5", ".5", "1e3", "2.5E-2", "5."].map(
      (s) => tokenize(s)[0].value,
    );

    expect(values).toEqual([12, 1.5, 0.5, 1000, 0.025, 5]);
  });

  it("reads letters of any script as a name", () => {
    const [name] = tokenize("שם_עלות.סכום");

    expect(name).toMatchObject({ type: "name", start: 0 });
    expect(name.end).toBe("שם_עלות.סכום".length);
  });

  it("stops a string at a new line", () => {
    const [str, space, name] = tokenize('"open\nname');

    expect(str).toMatchObject({ type: "string", closed: false });
    expect(space.type).toBe("space");
    expect(name.type).toBe("name");
  });

  it("does not cut a surrogate pair in two", () => {
    const tokens = tokenize("😀");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: "error", start: 0, end: 2 });
  });
});

describe("parseFormula", () => {
  it("returns no tree for empty or blank text", () => {
    expect(parseFormula("").ast).toBeNull();
    expect(parseFormula(" \n ").ast).toBeNull();
    expect(parseFormula(" ").diagnostics).toEqual([]);
  });

  it("applies operator precedence", () => {
    expect(ast("1 + 2 * 3")).toEqual(["+", 1, ["*", 2, 3]]);
    expect(ast("1 * 2 + 3")).toEqual(["+", ["*", 1, 2], 3]);
    expect(ast("a & b + 1")).toEqual(["&", "a", ["+", "b", 1]]);
    expect(ast("a = 1 && b = 2 || c")).toEqual([
      "||",
      ["&&", ["=", "a", 1], ["=", "b", 2]],
      "c",
    ]);
  });

  it("is left to right, except ^", () => {
    expect(ast("1 - 2 - 3")).toEqual(["-", ["-", 1, 2], 3]);
    expect(ast("2 ^ 3 ^ 2")).toEqual(["^", 2, ["^", 3, 2]]);
  });

  it("binds ^ tighter than a prefix minus", () => {
    expect(ast("-2 ^ 2")).toEqual(["-", ["^", 2, 2]]);
    expect(ast("2 ^ -2")).toEqual(["^", 2, ["-", 2]]);
  });

  it("takes a comparison as the operand of not", () => {
    expect(ast("not a = b and c")).toEqual([
      "&&",
      ["not", ["=", "a", "b"]],
      "c",
    ]);
    expect(ast("!a")).toEqual(["not", "a"]);
  });

  it("reads word operators in operator position and calls elsewhere", () => {
    expect(ast("a and b")).toEqual(["&&", "a", "b"]);
    expect(ast("AND(a, b)")).toEqual(["AND", "a", "b"]);
    expect(ast("NOT(a)")).toEqual(["NOT", "a"]);
  });

  it("maps the alternative spellings of equality and inequality", () => {
    expect(ast("a == b")).toEqual(["=", "a", "b"]);
    expect(ast("a != b")).toEqual(["<>", "a", "b"]);
  });

  it("parses calls, groups, fields and constants", () => {
    expect(ast('IF(status = "open", {unit price} * 1.2, TRUE)')).toEqual([
      "IF",
      ["=", "status", "open"],
      ["*", "unit price", 1.2],
      true,
    ]);
    expect(ast("f()")).toEqual(["f"]);
    expect(ast("(1 + 2) * 3")).toEqual(["*", ["()", ["+", 1, 2]], 3]);
  });

  it("gives every node a range inside the source", () => {
    const source = "ROUND( price * 2 , 1 )";
    const call = parseFormula(source).ast as FormulaCallNode;

    expect([call.start, call.end]).toEqual([0, source.length]);
    expect(source.slice(call.args[0].start, call.args[0].end)).toBe(
      "price * 2",
    );
  });

  describe("errors", () => {
    it("reports an unclosed parenthesis at the opening one", () => {
      expect(parseFormula("1 + (2 * 3").diagnostics).toEqual([
        expect.objectContaining({ code: "unclosed-paren", start: 4, end: 5 }),
      ]);
      expect(parseFormula("ROUND(price, 2").diagnostics).toEqual([
        expect.objectContaining({ code: "unclosed-paren", start: 5, end: 6 }),
      ]);
    });

    it("reports an unmatched closing parenthesis", () => {
      expect(parseFormula("1 + 2)").diagnostics).toEqual([
        expect.objectContaining({ code: "unmatched-paren", start: 5, end: 6 }),
      ]);
    });

    it("reports a missing operand at the operator", () => {
      expect(parseFormula("1 +").diagnostics).toEqual([
        expect.objectContaining({
          code: "expected-operand",
          start: 2,
          end: 3,
        }),
      ]);
      expect(codes("* 2")).toEqual(["expected-operand"]);
      expect(codes("-")).toEqual(["expected-operand"]);
    });

    it("reports two values with no operator between them", () => {
      expect(parseFormula("price 2").diagnostics).toEqual([
        expect.objectContaining({ code: "unexpected-token", start: 6, end: 7 }),
      ]);
    });

    it("reports missing arguments", () => {
      expect(codes("f(,)")).toEqual(["missing-argument", "missing-argument"]);
      expect(codes("f(a,)")).toEqual(["missing-argument"]);
      expect(codes("()")).toEqual(["empty-group"]);
    });

    it("reports every error in a formula, not only the first", () => {
      const found = codes('f(1 +, "x) + {y + g(');

      expect(found).toEqual(
        expect.arrayContaining(["expected-operand", "unterminated-string"]),
      );
      expect(found.length).toBeGreaterThanOrEqual(3);
    });

    it("keeps parsing after an error to find the next", () => {
      expect(codes("(1 + ) + (2 * ) + 3 @")).toEqual([
        "expected-operand",
        "expected-operand",
        "unexpected-character",
      ]);
    });

    it("reports unterminated strings and fields, and empty fields", () => {
      expect(codes('"open')).toEqual(["unterminated-string"]);
      expect(codes("{price")).toEqual(["unterminated-field"]);
      expect(codes("{}")).toEqual(["empty-field"]);
    });

    it("reports a number too large to hold", () => {
      expect(codes("1e999")).toEqual(["number-range"]);
      expect(codes("9".repeat(400))).toEqual(["number-range"]);
    });

    it("reports sorted, in-range diagnostics", () => {
      const source = ') ( * "a {b @ 1e999 f(,';
      const { diagnostics } = parseFormula(source);

      expect(diagnostics.length).toBeGreaterThan(3);
      for (let i = 0; i < diagnostics.length; i++) {
        const d = diagnostics[i];
        expect(d.start).toBeGreaterThanOrEqual(0);
        expect(d.end).toBeLessThanOrEqual(source.length);
        expect(d.end).toBeGreaterThanOrEqual(d.start);
        if (i > 0) {
          expect(d.start).toBeGreaterThanOrEqual(diagnostics[i - 1].start);
        }
      }
    });

    it("keeps a bounded number of diagnostics", () => {
      expect(parseFormula("@".repeat(5000)).diagnostics).toHaveLength(
        MAX_DIAGNOSTICS,
      );
    });
  });
});

describe("field names", () => {
  it("escapes a closing brace and a backslash", () => {
    expect(escapeFieldName("a}b\\c")).toBe("a\\}b\\\\c");
  });

  it.each([
    ["price", true],
    ["order.total", true],
    ["שם", true],
    ["unit price", false],
    ["2fast", false],
    ["and", false],
    ["TRUE", false],
  ])("isBareName(%s) is %s", (name, bare) => {
    expect(isBareName(name)).toBe(bare);
  });
});
