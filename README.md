# dom-observer

- HTMLElement.prototype.onceNodeInserted: 
  (validCSSSelectorStringOrRegularExpression: string | RegExp) => Promise<Node[]>
- HTMLElement.prototype.onNodeInserted:
  (validCSSSelectorStringOrRegularExpression: string | RegExp, callback: Node[] => void) => void
- HTMLElement.prototype.onceNodeRemoved:
  (validCSSSelectorStringOrRegularExpression: string | RegExp) => Promise<Node[]>
- HTMLElement.prototype.onNodeRemoved:
  (validCSSSelectorStringOrRegularExpression: string | RegExp, callback: Node[] => void) => void
- HTMLElement.prototype.onceAttributeAdded:
  (attributeMap: Map<string, string>) => Promise<Node[]>
- HTMLElement.prototype.onAttributeAdded:
  (attributeMap: Map<string, string>, callback: Node[] => void) => void
- HTMLElement.prototype.onceAttributeRemoved:
  (attributeMap: Map<string, string>) => Promise<Node[]>
- HTMLElement.prototype.onAttributeRemoved:
  (attributeMap: Map<string, string>, callback: Node[] => void) => void
- HTMLElement.prototype.onceTextAdded:
  (regex: Regex) => Promise<Node[]>
- HTMLElement.prototype.onTextAdded,
  (attributeMap: Map<string, string>, callback: Node[] => void) => 
- HTMLElement.prototype.onceTextRemoved:
  (regex: Regex) => Promise<Node[]>
- HTMLElement.prototype.onTextRemoved:
  (attributeMap: Map<string, string>, callback: Node[] => void) => void
