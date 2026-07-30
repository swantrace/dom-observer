export type NodeSearchTerm = string | RegExp;
export type AttributeSearchTerm = Map<string, string>;
export type MutationCallback = (nodes: Node[]) => void;
export type StopObserving = () => void;

declare global {
  interface HTMLElement {
    onceNodeInserted(term: NodeSearchTerm): Promise<Node[]>;
    onNodeInserted(
      term: NodeSearchTerm,
      callback: MutationCallback,
    ): StopObserving;
    onceNodeRemoved(term: NodeSearchTerm): Promise<Node[]>;
    onNodeRemoved(
      term: NodeSearchTerm,
      callback: MutationCallback,
    ): StopObserving;
    onceAttributeAdded(term: AttributeSearchTerm): Promise<Node[]>;
    onAttributeAdded(
      term: AttributeSearchTerm,
      callback: MutationCallback,
    ): StopObserving;
    onceAttributeRemoved(term: AttributeSearchTerm): Promise<Node[]>;
    onAttributeRemoved(
      term: AttributeSearchTerm,
      callback: MutationCallback,
    ): StopObserving;
    onceTextAdded(term: RegExp): Promise<Node[]>;
    onTextAdded(term: RegExp, callback: MutationCallback): StopObserving;
    onceTextRemoved(term: RegExp): Promise<Node[]>;
    onTextRemoved(term: RegExp, callback: MutationCallback): StopObserving;
  }
}

type MutationKind = "childList" | "attributes" | "characterData";
type Direction = "added" | "removed";
type SearchTerm = NodeSearchTerm | AttributeSearchTerm;

function matchesRegex(regex: RegExp, value: string | null): boolean {
  regex.lastIndex = 0;
  return regex.test(value ?? "");
}

function isSelector(term: SearchTerm): term is string {
  if (typeof term !== "string") return false;

  try {
    document.querySelector(term);
    return true;
  } catch {
    return false;
  }
}

function isAttributeMap(term: SearchTerm): term is AttributeSearchTerm {
  return (
    term instanceof Map &&
    [...term.keys()].every((key) => typeof key === "string") &&
    [...term.values()].every((value) => typeof value === "string")
  );
}

function validateTerm(kind: MutationKind, term: SearchTerm): void {
  if (kind === "attributes" && !isAttributeMap(term)) {
    throw new TypeError("Attribute observations require a Map<string, string>");
  }

  if (kind === "characterData" && !(term instanceof RegExp)) {
    throw new TypeError("Text observations require a regular expression");
  }

  if (kind === "childList" && !isSelector(term) && !(term instanceof RegExp)) {
    throw new TypeError(
      "Node observations require a valid CSS selector or RegExp",
    );
  }
}

function matchingAddedNodes(
  record: MutationRecord,
  term: NodeSearchTerm,
): Node[] {
  const matches: Node[] = [];

  for (const node of record.addedNodes) {
    if (typeof term === "string" && node instanceof Element) {
      if (node.matches(term)) matches.push(node);
      matches.push(...node.querySelectorAll(term));
    } else if (term instanceof RegExp) {
      if (
        node.nodeType === Node.TEXT_NODE &&
        matchesRegex(term, node.textContent)
      ) {
        if (node.parentNode) matches.push(node.parentNode);
      } else if (
        node instanceof Element &&
        matchesRegex(term, node.textContent)
      ) {
        matches.push(node);
      }
    }
  }

  return matches;
}

function matchingRemovedNodes(
  record: MutationRecord,
  term: NodeSearchTerm,
): Node[] {
  for (const node of record.removedNodes) {
    if (
      (typeof term === "string" &&
        node instanceof Element &&
        (node.matches(term) || node.querySelector(term) !== null)) ||
      (term instanceof RegExp && matchesRegex(term, node.textContent))
    ) {
      return [record.target];
    }
  }

  return [];
}

function matchingAttributeNodes(
  record: MutationRecord,
  term: AttributeSearchTerm,
  direction: Direction,
): Node[] {
  if (!(record.target instanceof Element) || !record.attributeName) return [];

  const expectedValue = term.get(record.attributeName);
  if (expectedValue === undefined) return [];

  const oldValue = record.oldValue ?? "";
  const currentValue = record.target.getAttribute(record.attributeName) ?? "";
  const hadValue = oldValue.includes(expectedValue);
  const hasValue = currentValue.includes(expectedValue);
  const matched =
    direction === "added" ? hasValue && !hadValue : hadValue && !hasValue;

  return matched ? [record.target] : [];
}

function matchingTextNodes(
  record: MutationRecord,
  term: RegExp,
  direction: Direction,
): Node[] {
  const hadValue = matchesRegex(term, record.oldValue);
  const hasValue = matchesRegex(term, record.target.textContent);
  const matched =
    direction === "added" ? hasValue && !hadValue : hadValue && !hasValue;

  return matched && record.target.parentNode ? [record.target.parentNode] : [];
}

function matchingNodes(
  records: MutationRecord[],
  kind: MutationKind,
  term: SearchTerm,
  direction: Direction,
): Node[] {
  const matches = records.flatMap((record) => {
    if (kind === "childList") {
      const nodeTerm = term as NodeSearchTerm;
      return direction === "added"
        ? matchingAddedNodes(record, nodeTerm)
        : matchingRemovedNodes(record, nodeTerm);
    }

    if (kind === "attributes") {
      return matchingAttributeNodes(
        record,
        term as AttributeSearchTerm,
        direction,
      );
    }

    return matchingTextNodes(record, term as RegExp, direction);
  });

  return [...new Set(matches)];
}

function observerOptions(
  kind: MutationKind,
  term: SearchTerm,
): MutationObserverInit {
  return {
    subtree: true,
    childList: kind === "childList",
    attributes: kind === "attributes",
    attributeOldValue: kind === "attributes",
    attributeFilter:
      kind === "attributes"
        ? [...(term as AttributeSearchTerm).keys()]
        : undefined,
    characterData: kind === "characterData",
    characterDataOldValue: kind === "characterData",
  };
}

function observeOnce(
  element: HTMLElement,
  kind: MutationKind,
  term: SearchTerm,
  direction: Direction,
): Promise<Node[]> {
  return new Promise((resolve, reject) => {
    try {
      validateTerm(kind, term);
    } catch (error) {
      reject(error);
      return;
    }

    const observer = new MutationObserver((records) => {
      const matches = matchingNodes(records, kind, term, direction);

      if (matches.length > 0) {
        observer.disconnect();
        resolve(matches);
      }
    });

    observer.observe(element, observerOptions(kind, term));
  });
}

function observeContinuously(
  element: HTMLElement,
  kind: MutationKind,
  term: SearchTerm,
  direction: Direction,
  callback: MutationCallback,
): StopObserving {
  validateTerm(kind, term);

  const observer = new MutationObserver((records) => {
    const matches = matchingNodes(records, kind, term, direction);

    if (matches.length > 0) {
      callback(matches);
    }
  });

  observer.observe(element, observerOptions(kind, term));

  return () => observer.disconnect();
}

const methods = {
  onceNodeInserted(this: HTMLElement, term: NodeSearchTerm) {
    return observeOnce(this, "childList", term, "added");
  },
  onNodeInserted(
    this: HTMLElement,
    term: NodeSearchTerm,
    callback: MutationCallback,
  ) {
    return observeContinuously(this, "childList", term, "added", callback);
  },
  onceNodeRemoved(this: HTMLElement, term: NodeSearchTerm) {
    return observeOnce(this, "childList", term, "removed");
  },
  onNodeRemoved(
    this: HTMLElement,
    term: NodeSearchTerm,
    callback: MutationCallback,
  ) {
    return observeContinuously(this, "childList", term, "removed", callback);
  },
  onceAttributeAdded(this: HTMLElement, term: AttributeSearchTerm) {
    return observeOnce(this, "attributes", term, "added");
  },
  onAttributeAdded(
    this: HTMLElement,
    term: AttributeSearchTerm,
    callback: MutationCallback,
  ) {
    return observeContinuously(this, "attributes", term, "added", callback);
  },
  onceAttributeRemoved(this: HTMLElement, term: AttributeSearchTerm) {
    return observeOnce(this, "attributes", term, "removed");
  },
  onAttributeRemoved(
    this: HTMLElement,
    term: AttributeSearchTerm,
    callback: MutationCallback,
  ) {
    return observeContinuously(this, "attributes", term, "removed", callback);
  },
  onceTextAdded(this: HTMLElement, term: RegExp) {
    return observeOnce(this, "characterData", term, "added");
  },
  onTextAdded(this: HTMLElement, term: RegExp, callback: MutationCallback) {
    return observeContinuously(this, "characterData", term, "added", callback);
  },
  onceTextRemoved(this: HTMLElement, term: RegExp) {
    return observeOnce(this, "characterData", term, "removed");
  },
  onTextRemoved(this: HTMLElement, term: RegExp, callback: MutationCallback) {
    return observeContinuously(
      this,
      "characterData",
      term,
      "removed",
      callback,
    );
  },
};

Object.assign(HTMLElement.prototype, methods);
