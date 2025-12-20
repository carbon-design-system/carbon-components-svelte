import { computeTreeLeafDepth } from "carbon-components-svelte/TreeView/TreeViewNode.svelte";

describe("computeTreeLeafDepth", () => {
  it("should return 1 for root-level node", () => {
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const li = document.createElement("li");
    tree.appendChild(li);

    assert(li instanceof HTMLLIElement);
    const depth = computeTreeLeafDepth(li);
    expect(depth).toBe(1);
  });

  it("should return 2 for first-level nested node", () => {
    // <ul role="tree">
    //   <li>  <!-- parent LI, counted -->
    //     <ul role="group">
    //       <li></li>  <!-- child LI, counted -->
    //     </ul>
    //   </li>
    // </ul>
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const parentLi = document.createElement("li");
    const group = document.createElement("ul");
    group.setAttribute("role", "group");

    const childLi = document.createElement("li");

    group.appendChild(childLi);
    parentLi.appendChild(group);
    tree.appendChild(parentLi);

    assert(childLi instanceof HTMLLIElement);
    const depth = computeTreeLeafDepth(childLi);
    expect(depth).toBe(2);
  });

  it("should return correct depth for deeply nested nodes", () => {
    // Create DOM structure:
    // <ul role="tree">
    //   <li>  <!-- level1, counted -->
    //     <ul role="group">
    //       <li>  <!-- level2, counted -->
    //         <ul role="group">
    //           <li></li>  <!-- level3, counted -->
    //         </ul>
    //       </li>
    //     </ul>
    //   </li>
    // </ul>
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const level1Li = document.createElement("li");
    const level1Group = document.createElement("ul");
    level1Group.setAttribute("role", "group");

    const level2Li = document.createElement("li");
    const level2Group = document.createElement("ul");
    level2Group.setAttribute("role", "group");

    const level3Li = document.createElement("li");

    level2Group.appendChild(level3Li);
    level2Li.appendChild(level2Group);
    level1Group.appendChild(level2Li);
    level1Li.appendChild(level1Group);
    tree.appendChild(level1Li);

    assert(level3Li instanceof HTMLLIElement);
    const depth = computeTreeLeafDepth(level3Li);
    expect(depth).toBe(3);
  });

  it("should handle null node gracefully", () => {
    const depth = computeTreeLeafDepth(null);
    expect(depth).toBe(0);
  });

  it("should not throw when parentNode becomes null", () => {
    const li = document.createElement("li");

    assert(li instanceof HTMLLIElement);
    expect(() => computeTreeLeafDepth(li)).not.toThrow();
  });

  it("should correctly count the first parent LI", () => {
    // 1. Move up: parentNode = parentNode.parentNode (skip the first LI)
    // 2. Check: if (parentNode.tagName === "LI") - but we've already skipped it!
    // The fixed code checks the current parentNode BEFORE moving up
    // <ul role="tree">
    //   <li></li>  <!-- This LI should be counted (depth = 1) -->
    // </ul>
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const li = document.createElement("li");
    tree.appendChild(li);

    assert(li instanceof HTMLLIElement);
    const depth = computeTreeLeafDepth(li);
    expect(depth).toBe(1);
  });

  it("should not throw when checking parentNode after it becomes null", () => {
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const li = document.createElement("li");
    tree.appendChild(li);

    assert(li instanceof HTMLLIElement);
    const depth = computeTreeLeafDepth(li);
    expect(depth).toBe(1);
    expect(() => computeTreeLeafDepth(li)).not.toThrow();
  });

  it("should correctly count all LI ancestors", () => {
    // Create a structure with multiple LI levels to ensure we count all of them
    // <ul role="tree">
    //   <li>  <!-- level 0 -->
    //     <ul role="group">
    //       <li>  <!-- level 1 -->
    //         <ul role="group">
    //           <li>  <!-- level 2 -->
    //             <ul role="group">
    //               <li></li>  <!-- level 3 -->
    //             </ul>
    //           </li>
    //         </ul>
    //       </li>
    //     </ul>
    //   </li>
    // </ul>
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const li0 = document.createElement("li");
    const group0 = document.createElement("ul");
    group0.setAttribute("role", "group");

    const li1 = document.createElement("li");
    const group1 = document.createElement("ul");
    group1.setAttribute("role", "group");

    const li2 = document.createElement("li");
    const group2 = document.createElement("ul");
    group2.setAttribute("role", "group");

    const li3 = document.createElement("li");

    group2.appendChild(li3);
    li2.appendChild(group2);
    group1.appendChild(li2);
    li1.appendChild(group1);
    group0.appendChild(li1);
    li0.appendChild(group0);
    tree.appendChild(li0);

    assert(li3 instanceof HTMLLIElement);
    const depth = computeTreeLeafDepth(li3);
    expect(depth).toBe(4);
  });

  it("should not throw when parentNode is a text node (non-Element node)", () => {
    const tree = document.createElement("ul");
    tree.setAttribute("role", "tree");

    const li = document.createElement("li");
    const textNode = document.createTextNode("some text");

    li.appendChild(textNode);
    tree.appendChild(li);

    assert(li instanceof HTMLLIElement);
    expect(() => computeTreeLeafDepth(li)).not.toThrow();
    const depth = computeTreeLeafDepth(li);
    expect(depth).toBe(1);
  });
});
