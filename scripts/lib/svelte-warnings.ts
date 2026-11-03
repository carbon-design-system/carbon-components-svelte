import { compile } from "svelte/compiler";

/** A warning or error the Svelte compiler reports for a component. */
export type CompilerDiagnostic = {
  severity: "error" | "warning";
  code: string;
  message: string;
  line: number;
  column: number;
};

/**
 * What `svelte/compiler` reports for a component (a11y, unused CSS, invalid
 * markup), without generating code. `<!-- svelte-ignore -->` applies, as in
 * a build. A compile error comes back as one `error`.
 */
export function compilerDiagnostics(
  source: string,
  filename: string,
): CompilerDiagnostic[] {
  try {
    const { warnings } = compile(source, { filename, generate: false });
    return warnings.map((w) => ({
      severity: "warning",
      code: w.code,
      message: w.message,
      line: w.start?.line ?? 1,
      column: (w.start?.column ?? 0) + 1,
    }));
  } catch (error) {
    const e = error as {
      code?: string;
      message: string;
      start?: { line: number; column: number };
    };
    return [
      {
        severity: "error",
        code: e.code ?? "compile_error",
        message: e.message,
        line: e.start?.line ?? 1,
        column: (e.start?.column ?? 0) + 1,
      },
    ];
  }
}
