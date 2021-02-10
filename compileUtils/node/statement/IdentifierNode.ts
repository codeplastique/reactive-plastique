import StatementNode from "./StatementNode";
import FunctionCallStatement from "../FunctionCallStatement";

export default class IdentifierNode implements StatementNode{
    protected readonly node: any
    constructor(node: any) {
        this.node = node;
    }

    public static of(name: string){
        return new IdentifierNode(name);
    }

    public static createThis(): IdentifierNode{
        return new IdentifierNode(ts.createThis());
    }

    public static createSuper(): IdentifierNode{
        return new IdentifierNode(ts.createSuper());
    }


    public createFunctionCallStatement(functionName: string, args?: any[]): FunctionCallStatement{
        return FunctionCallStatement.of(this, functionName, args)
    }

    getRaw(): any {
        return this.node
    }
}