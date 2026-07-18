import { describe, expect, it, vi } from "vitest";
import "./index";

describe("DOM observer extensions", () => {
  it("resolves with an inserted element matching a selector", async () => {
    const root = document.createElement("div");
    const observed = root.onceNodeInserted(".item");
    const item = document.createElement("span");
    item.className = "item";

    root.append(item);

    await expect(observed).resolves.toEqual([item]);
  });

  it("includes both an inserted matching root and matching descendants", async () => {
    const root = document.createElement("div");
    const observed = root.onceNodeInserted(".item");
    const parent = document.createElement("section");
    const child = document.createElement("span");
    parent.className = "item";
    child.className = "item";
    parent.append(child);

    root.append(parent);

    await expect(observed).resolves.toEqual([parent, child]);
  });

  it("returns the parent when a matching node is removed", async () => {
    const root = document.createElement("div");
    const item = document.createElement("span");
    item.className = "item";
    root.append(item);
    const observed = root.onceNodeRemoved(".item");

    item.remove();

    await expect(observed).resolves.toEqual([root]);
  });

  it("observes an attribute value being added from a missing attribute", async () => {
    const root = document.createElement("div");
    const item = document.createElement("span");
    root.append(item);
    const observed = root.onceAttributeAdded(
      new Map([["data-state", "ready"]]),
    );

    item.setAttribute("data-state", "ready");

    await expect(observed).resolves.toEqual([item]);
  });

  it("observes text being added and removed", async () => {
    const root = document.createElement("div");
    const text = document.createTextNode("waiting");
    root.append(text);
    const added = root.onceTextAdded(/ready/g);

    text.textContent = "ready";
    await expect(added).resolves.toEqual([root]);

    const removed = root.onceTextRemoved(/ready/g);
    text.textContent = "done";
    await expect(removed).resolves.toEqual([root]);
  });

  it("invokes the continuous removal callback", async () => {
    const root = document.createElement("div");
    const item = document.createElement("span");
    item.className = "item";
    root.append(item);
    const callback = vi.fn();
    root.onNodeRemoved(".item", callback);

    item.remove();
    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith([root]));
  });

  it("rejects invalid search terms", async () => {
    const root = document.createElement("div");

    await expect(root.onceNodeInserted("[")).rejects.toThrow(TypeError);
  });
});
