import NameableNode from "./NameableNode";

export default class Type extends NameableNode{
    constructor(node){
        super(node)
    }

    isComposite(): boolean{
        return this.node.members != null
    }
}