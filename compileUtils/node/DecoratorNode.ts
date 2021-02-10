import NameableNode from "./NameableNode";
import ExpressionNode from "./ExpressionNode";

export default class DecoratorNode extends NameableNode{
    constructor(node){
        super(node);
    }

    getArguments(): ExpressionNode[]{
        return (this.node.arguments || []).map(a => ExpressionNode.of(a));
    }
}