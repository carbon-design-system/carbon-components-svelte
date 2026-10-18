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

  it("should handle null node gracefully", () => {
    const depth = computeTreeLeafDepth(null);
    expect(depth).toBe(0);
  });

  it("should not throw when parentNode becomes null", () => {
    const li = document.createElement("li");

    assert(li instanceof HTMLLIElement);
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
});
