# dom-observer
  > observe an element, so when one specific mutation (['add', 'remove'] x ['childList', 'attribute', 'characterData']) happens on the element, we can have some code to run on the relevant nodes (for childList, if it's an add function, relevant nodes are new nodes just added, if it's an remove function, relevant nodes are removed nodes' parent nodes). once* functions will only be triggered once, but on* functions will keep observing.


- HTMLElement.prototype.onceNodeInserted: 
  #### (validCSSSelectorStringOrRegularExpression: string | RegExp) => Promise<Node[]>
- HTMLElement.prototype.onNodeInserted:
  #### (validCSSSelectorStringOrRegularExpression: string | RegExp, callback: (childNodes: Node[]) => void) => void
- HTMLElement.prototype.onceNodeRemoved:
  #### (validCSSSelectorStringOrRegularExpression: string | RegExp) => Promise<Node[]>
- HTMLElement.prototype.onNodeRemoved:
  #### (validCSSSelectorStringOrRegularExpression: string | RegExp, callback: (childNodes: Node[]) => void) => void
- HTMLElement.prototype.onceAttributeAdded:
  #### (attributeMap: Map<string, string>) => Promise<Node[]>
- HTMLElement.prototype.onAttributeAdded:
  #### (attributeMap: Map<string, string>, callback: (childNodes: Node[]) => void) => void
- HTMLElement.prototype.onceAttributeRemoved:
  #### (attributeMap: Map<string, string>) => Promise<Node[]>
- HTMLElement.prototype.onAttributeRemoved:
  #### (attributeMap: Map<string, string>, callback: (childNodes: Node[]) => void) => void
- HTMLElement.prototype.onceTextAdded:
  #### (regex: Regex) => Promise<Node[]>
- HTMLElement.prototype.onTextAdded,
  #### (regex: Regex, callback: (childNodes: Node[]) => void) => void
- HTMLElement.prototype.onceTextRemoved:
  #### (regex: Regex) => Promise<Node[]>
- HTMLElement.prototype.onTextRemoved:
  #### (regex: Regex, callback: (childNodes: Node[]) => void) => void
