# DOM Observer

[![CI](https://github.com/swantrace/dom-observer/actions/workflows/ci.yml/badge.svg)](https://github.com/swantrace/dom-observer/actions/workflows/ci.yml)

> [!WARNING]
> **Project status: experimental.** This library is being redesigned from an
> internal Shopify integration utility into a reusable browser package. Its API
> is unstable, it is not published to npm, and production use is not currently
> recommended.

A small TypeScript library that turns DOM mutations into one-time promises or
continuous callbacks. It supports inserted and removed nodes, attribute value
changes, and text changes.

It originated in Shopify storefront work where multiple independently installed
apps could modify the same price or promotional markup. DOM Observer allowed an
integration to detect those conflicts and restore the authoritative content it
owned.

## Roadmap

- [x] Migrate the library to TypeScript
- [x] Add a Vite library build
- [x] Add DOM integration tests with Vitest
- [x] Build an interactive recurring-conflict demo
- [x] Run checks, tests, builds, and package validation in CI
- [ ] Replace prototype extensions with exported functions
- [ ] Add observer cleanup and `AbortSignal` support
- [ ] Add mutation-loop protection and conflict limits
- [ ] Add performance and cross-browser tests
- [ ] Choose a unique package name
- [ ] Deploy the interactive demo
- [ ] Publish an npm beta

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

> The API below represents the current experimental design and may change before
> the first public release.

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
