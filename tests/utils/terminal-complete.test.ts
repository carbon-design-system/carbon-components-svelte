// @vitest-environment node
import {
  applyCompletion,
  commonPrefix,
  wordStart,
} from "../../src/utils/terminal-complete.js";

describe("terminal completion", () => {
  it("finds the word at the cursor", () => {
    expect(wordStart("kubectl get po", 14)).toBe(12);
    expect(wordStart("kubectl get po", 7)).toBe(0);
    expect(wordStart("", 0)).toBe(0);
    expect(wordStart("ab", 99)).toBe(0);
  });

  it("finds what candidates share", () => {
    expect(commonPrefix(["kubectl", "kubeadm"])).toBe("kube");
    expect(commonPrefix(["a", "b"])).toBe("");
    expect(commonPrefix([])).toBe("");
    expect(commonPrefix(["same"])).toBe("same");
  });

  it("completes one candidate and adds a space, except after / or =", () => {
    expect(applyCompletion("kubectl get po", 14, ["pods"])).toEqual({
      value: "kubectl get pods ",
      cursor: 17,
      list: [],
    });
    expect(applyCompletion("cd sr", 5, ["src/"]).value).toBe("cd src/");
    expect(applyCompletion("--na", 4, ["--name="]).value).toBe("--name=");
  });

  it("completes in the middle of a line", () => {
    expect(applyCompletion("get po -o json", 6, ["pods"])).toEqual({
      value: "get pods  -o json",
      cursor: 9,
      list: [],
    });
  });

  it("extends to the common prefix, or lists when that adds nothing", () => {
    expect(applyCompletion("ku", 2, ["kubectl", "kubeadm"])).toMatchObject({
      value: "kube",
      list: [],
    });
    expect(applyCompletion("kube", 4, ["kubectl", "kubeadm"])).toEqual({
      value: "kube",
      cursor: 4,
      list: ["kubectl", "kubeadm"],
    });
  });

  it("takes the range from an object result", () => {
    expect(
      applyCompletion("run --image=ng", 14, {
        from: 12,
        candidates: ["nginx", "nginx-ingress"],
      }),
    ).toMatchObject({ value: "run --image=nginx", cursor: 17 });
  });

  it("drops duplicates, empties and control characters", () => {
    const result = applyCompletion("a", 1, [
      "ab\x1b[31m",
      "ab\x1b[31m",
      "",
      "ab[31m",
    ]);
    expect(result.value).toBe("ab[31m ");
    expect(result.list).toEqual([]);
    expect(applyCompletion("a", 1, [])).toEqual({
      value: "a",
      cursor: 1,
      list: [],
    });
  });

  it("leaves the line alone for a result that is not candidates", () => {
    for (const bad of [null, undefined, "pods", {}, { candidates: "x" }]) {
      expect(applyCompletion("ab", 2, bad as never).value).toBe("ab");
    }
  });
});
