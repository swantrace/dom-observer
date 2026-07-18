# DOM Observer

A small TypeScript library that turns DOM mutations into one-time promises or
continuous callbacks. It supports inserted and removed nodes, attribute value
changes, and text changes.

## Development

```sh
npm install
npm run dev
```

The demo is served by Vite. Other useful commands are:

```sh
npm test          # run the Vitest suite once
npm run test:watch
npm run check     # run Biome and TypeScript checks
npm run check:fix # format and apply safe lint fixes
npm run build     # build ESM, UMD, and TypeScript declarations
```

## Usage

Importing the library installs typed helpers on `HTMLElement.prototype`:

```ts
import "dom-observer";

const list = document.querySelector<HTMLUListElement>("#items");

if (list) {
  const [item] = await list.onceNodeInserted("li");
  console.log("An item was inserted", item);

  list.onAttributeAdded(new Map([["data-state", "ready"]]), (nodes) => {
    console.log("Elements that became ready", nodes);
  });
}
```

The `once*` methods resolve on the first matching mutation. The `on*` methods
continue observing and invoke their callback for every matching mutation.

## API

- `onceNodeInserted(term: string | RegExp): Promise<Node[]>`
- `onNodeInserted(term: string | RegExp, callback): void`
- `onceNodeRemoved(term: string | RegExp): Promise<Node[]>`
- `onNodeRemoved(term: string | RegExp, callback): void`
- `onceAttributeAdded(term: Map<string, string>): Promise<Node[]>`
- `onAttributeAdded(term: Map<string, string>, callback): void`
- `onceAttributeRemoved(term: Map<string, string>): Promise<Node[]>`
- `onAttributeRemoved(term: Map<string, string>, callback): void`
- `onceTextAdded(term: RegExp): Promise<Node[]>`
- `onTextAdded(term: RegExp, callback): void`
- `onceTextRemoved(term: RegExp): Promise<Node[]>`
- `onTextRemoved(term: RegExp, callback): void`

## License

MIT
