import IdentifierNode from "./statement/IdentifierNode";

export default class NameableNode{
    constructor(protected readonly node){}

    public getName(): string{
        return this.node.name.escapedText;
    }

    public getIdentifier(): IdentifierNode{
        return IdentifierNode.of(this.getName());
    }
}
