import NameableNode from "./NameableNode";
import DecoratorNode from "./DecoratorNode";
import Decoratable from "./Decoratable";

export default class FunctionParameterNode extends NameableNode implements Decoratable{
    constructor(node){
        super(node);
    }

    isVarArg(): boolean{
        return this.node.dotDotDotToken;
    }

    getType(){

    }

    public getDecorators(): DecoratorNode[]{
        return (this.node.decorators || []).map(d => new DecoratorNode(d));
    }
}