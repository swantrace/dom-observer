import "./index";

const list = document.querySelector<HTMLUListElement>("#items");
const button = document.querySelector<HTMLButtonElement>("#add-item");

if (!list || !button) {
  throw new Error("Demo elements could not be found");
}

list.onNodeInserted("li", (nodes) => {
  console.log("Observed inserted list items:", nodes);
});

button.addEventListener("click", () => {
  const item = document.createElement("li");
  item.textContent = `Item ${list.children.length + 1}`;
  list.append(item);
});
