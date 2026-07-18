import { expect, it, vi } from "vitest";

it("shows once* repairing once while on* repairs all three changes", async () => {
  document.body.innerHTML = '<div id="comparison-demos"></div>';
  await import("./demo");

  const comparisons = [
    ...document.querySelectorAll<HTMLElement>(".comparison"),
  ];
  const lanes = [...document.querySelectorAll<HTMLElement>(".lane")];
  expect(comparisons).toHaveLength(6);
  expect(lanes).toHaveLength(12);

  for (const comparison of comparisons) {
    const button = comparison.querySelector<HTMLButtonElement>(".run-script");
    if (!button) throw new Error("Comparison is missing its run button");
    button.click();
  }

  await vi.waitFor(
    () => {
      for (const comparison of comparisons) {
        const counts = [...comparison.querySelectorAll(".repair-count")].map(
          (element) => element.textContent,
        );
        expect(counts).toEqual(["1 repair", "3 repairs"]);
        expect(
          comparison.querySelector(".comparison__conclusion")?.textContent,
        ).toContain("on* repaired 3 changes");
      }
    },
    { timeout: 2_000, interval: 20 },
  );
});
