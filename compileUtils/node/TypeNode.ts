import NameableNode from "./NameableNode";

export default class TypeNode extends NameableNode{
    constructor(node){
        super(node)
    }

    isComposite(): boolean{
        return this.node.members != null
    }
}