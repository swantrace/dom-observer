import "./index";
import "./style.css";

type ComparisonDefinition = {
  title: string;
  explanation: string;
  onceMethod: string;
  onMethod: string;
  onceCode: string;
  onCode: string;
  originalHtml: string;
  mutate: (target: HTMLElement, iteration: number) => void;
  watchOnce: (target: HTMLElement, repair: (nodes: Node[]) => void) => void;
  watchOn: (target: HTMLElement, repair: (nodes: Node[]) => void) => void;
  restore: (target: HTMLElement) => void;
};

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Required demo element not found: ${selector}`);
  return element;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function setText(target: HTMLElement, value: string): void {
  const text = target.firstChild;
  if (!text) throw new Error("Text demo target has no text node");
  text.textContent = value;
}

const attributeTerm = () => new Map([["data-state", "hijacked"]]);

const comparisons: ComparisonDefinition[] = [
  {
    title: "Inserted node",
    explanation:
      "Another script injects an unwanted badge. Your callback removes each matching node.",
    onceMethod: "onceNodeInserted",
    onMethod: "onNodeInserted",
    onceCode: 'target.onceNodeInserted(".injected")\n  .then(removeNodes)',
    onCode: 'target.onNodeInserted(".injected",\n  removeNodes)',
    originalHtml: '<span class="content">Original content</span>',
    mutate: (target, iteration) => {
      target.insertAdjacentHTML(
        "beforeend",
        `<mark class="injected">Injected #${iteration}</mark>`,
      );
    },
    watchOnce: (target, repair) =>
      void target.onceNodeInserted(".injected").then(repair),
    watchOn: (target, repair) => target.onNodeInserted(".injected", repair),
    restore: (_target) => {},
  },
  {
    title: "Removed node",
    explanation:
      "Another script deletes protected content. Your callback rebuilds the original markup.",
    onceMethod: "onceNodeRemoved",
    onMethod: "onNodeRemoved",
    onceCode: 'target.onceNodeRemoved(".protected")\n  .then(restoreHtml)',
    onCode: 'target.onNodeRemoved(".protected",\n  restoreHtml)',
    originalHtml: '<span class="protected">Protected content</span>',
    mutate: (target) => {
      target.innerHTML = '<span class="protected">Protected content</span>';
      target.querySelector(".protected")?.remove();
    },
    watchOnce: (target, repair) =>
      void target.onceNodeRemoved(".protected").then(repair),
    watchOn: (target, repair) => target.onNodeRemoved(".protected", repair),
    restore: (target) => {
      target.innerHTML = '<span class="protected">Protected content</span>';
    },
  },
  {
    title: "Added attribute value",
    explanation:
      "Another script marks your element as hijacked. Your callback removes that state.",
    onceMethod: "onceAttributeAdded",
    onMethod: "onAttributeAdded",
    onceCode:
      'target.onceAttributeAdded(\n  new Map([["data-state", "hijacked"]])\n).then(restoreAttribute)',
    onCode:
      'target.onAttributeAdded(\n  new Map([["data-state", "hijacked"]]),\n  restoreAttribute\n)',
    originalHtml: "Original state",
    mutate: (target) => {
      target.removeAttribute("data-state");
      target.setAttribute("data-state", "hijacked");
    },
    watchOnce: (target, repair) =>
      void target.onceAttributeAdded(attributeTerm()).then(repair),
    watchOn: (target, repair) =>
      target.onAttributeAdded(attributeTerm(), repair),
    restore: (target) => target.removeAttribute("data-state"),
  },
  {
    title: "Removed attribute value",
    explanation:
      "Another script removes a required state. Your callback puts the original value back.",
    onceMethod: "onceAttributeRemoved",
    onMethod: "onAttributeRemoved",
    onceCode:
      'target.onceAttributeRemoved(\n  new Map([["data-state", "hijacked"]])\n).then(restoreAttribute)',
    onCode:
      'target.onAttributeRemoved(\n  new Map([["data-state", "hijacked"]]),\n  restoreAttribute\n)',
    originalHtml: "Required state",
    mutate: (target) => {
      target.setAttribute("data-state", "hijacked");
      target.removeAttribute("data-state");
    },
    watchOnce: (target, repair) =>
      void target.onceAttributeRemoved(attributeTerm()).then(repair),
    watchOn: (target, repair) =>
      target.onAttributeRemoved(attributeTerm(), repair),
    restore: (target) => target.setAttribute("data-state", "hijacked"),
  },
  {
    title: "Added text",
    explanation:
      "Another script replaces your copy with an injected message. Your callback restores it.",
    onceMethod: "onceTextAdded",
    onMethod: "onTextAdded",
    onceCode: "target.onceTextAdded(/injected/i)\n  .then(restoreText)",
    onCode: "target.onTextAdded(/injected/i,\n  restoreText)",
    originalHtml: "Original message",
    mutate: (target, iteration) => {
      setText(target, "Original message");
      setText(target, `Injected message #${iteration}`);
    },
    watchOnce: (target, repair) =>
      void target.onceTextAdded(/injected/i).then(repair),
    watchOn: (target, repair) => target.onTextAdded(/injected/i, repair),
    restore: (target) => setText(target, "Original message"),
  },
  {
    title: "Removed text",
    explanation:
      "Another script erases required wording. Your callback restores the protected message.",
    onceMethod: "onceTextRemoved",
    onMethod: "onTextRemoved",
    onceCode: "target.onceTextRemoved(/protected/i)\n  .then(restoreText)",
    onCode: "target.onTextRemoved(/protected/i,\n  restoreText)",
    originalHtml: "Protected message",
    mutate: (target) => {
      setText(target, "Protected message");
      setText(target, "Message erased");
    },
    watchOnce: (target, repair) =>
      void target.onceTextRemoved(/protected/i).then(repair),
    watchOn: (target, repair) => target.onTextRemoved(/protected/i, repair),
    restore: (target) => setText(target, "Protected message"),
  },
];

function createLane(
  mode: "once" | "on",
  definition: ComparisonDefinition,
): HTMLElement {
  const method = mode === "once" ? definition.onceMethod : definition.onMethod;
  const code = mode === "once" ? definition.onceCode : definition.onCode;
  const lane = document.createElement("section");
  lane.className = `lane lane--${mode}`;
  lane.innerHTML = `
    <header class="lane__header">
      <span class="mode-badge">${mode === "once" ? "Promise · once" : "Callback · continuous"}</span>
      <span class="repair-count">0 repairs</span>
    </header>
    <h4>${method}</h4>
    <pre><code>${code}</code></pre>
    <div class="dom-window">
      <div class="dom-window__bar"><i></i><i></i><i></i><span>live DOM</span></div>
      <div class="observed-target">${definition.originalHtml}</div>
    </div>
    <div class="lane__status"><i></i><span>Observer armed</span></div>
  `;
  return lane;
}

function initializeLane(
  lane: HTMLElement,
  mode: "once" | "on",
  definition: ComparisonDefinition,
): { target: HTMLElement; getRepairs: () => number } {
  const target = requiredElement<HTMLElement>(lane, ".observed-target");
  const count = requiredElement<HTMLElement>(lane, ".repair-count");
  const status = requiredElement<HTMLElement>(lane, ".lane__status span");
  let repairs = 0;

  const repair = (nodes: Node[]) => {
    repairs += 1;
    if (definition.onceMethod === "onceNodeInserted") {
      for (const node of nodes) node.parentNode?.removeChild(node);
    } else {
      definition.restore(target);
    }
    count.textContent = `${repairs} ${repairs === 1 ? "repair" : "repairs"}`;
    status.textContent =
      mode === "once"
        ? "Repaired once · observer stopped"
        : "Repaired · still watching";
    lane.classList.remove("lane--repaired");
    void lane.offsetWidth;
    lane.classList.add("lane--repaired");
  };

  if (mode === "once") definition.watchOnce(target, repair);
  else definition.watchOn(target, repair);

  return { target, getRepairs: () => repairs };
}

function createComparison(
  definition: ComparisonDefinition,
  index: number,
): HTMLElement {
  const article = document.createElement("article");
  article.className = "comparison";
  article.innerHTML = `
    <header class="comparison__header">
      <span class="comparison__number">0${index + 1}</span>
      <div><h3>${definition.title}</h3><p>${definition.explanation}</p></div>
      <button type="button" class="run-script">Run external script ×3 <span>▶</span></button>
    </header>
    <div class="script-progress" aria-live="polite"><span></span><strong>Ready to simulate interference</strong></div>
    <div class="lanes"></div>
    <p class="comparison__conclusion" aria-live="polite"></p>
  `;

  const lanes = requiredElement<HTMLElement>(article, ".lanes");
  const button = requiredElement<HTMLButtonElement>(article, ".run-script");
  const progress = requiredElement<HTMLElement>(article, ".script-progress");
  const progressText = requiredElement<HTMLElement>(progress, "strong");
  const conclusion = requiredElement<HTMLElement>(
    article,
    ".comparison__conclusion",
  );

  let onceState: ReturnType<typeof initializeLane>;
  let onState: ReturnType<typeof initializeLane>;

  const reset = () => {
    lanes.replaceChildren();
    const onceLane = createLane("once", definition);
    const onLane = createLane("on", definition);
    lanes.append(onceLane, onLane);
    onceState = initializeLane(onceLane, "once", definition);
    onState = initializeLane(onLane, "on", definition);
    conclusion.textContent = "";
  };
  reset();

  button.addEventListener("click", async () => {
    button.disabled = true;
    reset();
    progress.classList.add("script-progress--running");

    for (let iteration = 1; iteration <= 3; iteration += 1) {
      progressText.textContent = `External JavaScript change ${iteration} of 3`;
      definition.mutate(onceState.target, iteration);
      definition.mutate(onState.target, iteration);
      await delay(280);
    }

    progress.classList.remove("script-progress--running");
    progressText.textContent = "Simulation complete";
    conclusion.innerHTML = `<strong>Result:</strong> once* repaired ${onceState.getRepairs()} change; on* repaired ${onState.getRepairs()} changes and preserved the original DOM.`;
    button.disabled = false;
  });

  return article;
}

const demoContainer = requiredElement<HTMLElement>(
  document,
  "#comparison-demos",
);
comparisons.forEach((definition, index) => {
  demoContainer.append(createComparison(definition, index));
});
