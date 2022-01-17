import ExpressionNode from "./ExpressionNode";
import StatementNode from "./statement/StatementNode";
import IdentifierNode from "./statement/IdentifierNode";
import NameableNode from "./NameableNode";
import Types from "../../base/Types";
import TypeNode from "./TypeNode";

export default class FunctionCallStatement extends NameableNode implements StatementNode{
    constructor(node){
        super(node)
    }

    protected static create(tsIdentifier: any, tsFunctionIdentifier: any, args?: ExpressionNode[]): FunctionCallStatement{
        let node = ts.createExpressionStatement(
            ts.createCall(
                tsIdentifier == null? tsFunctionIdentifier: ts.createPropertyAccess(tsIdentifier, tsFunctionIdentifier),
                undefined,
                args || []
            ));
        return new FunctionCallStatement(node);
    }

    static from(functionName: string, args?: ExpressionNode[]): FunctionCallStatement{
        return this.create(null, ts.createIdentifier(functionName), args);
    }

    static of(identifier: IdentifierNode, functionName: string, args?: any[]): FunctionCallStatement{
        let argsNodes = args.map(a => ExpressionNode.of(a));
        return this.create(identifier.getRaw(), ts.createIdentifier(functionName), argsNodes);
    }

    // static ofThis(functionName: string, args?: ExpressionNode[]): FunctionCallStatement{
    //     return this.create(ts.createThis(), ts.createIdentifier(functionName), args);
    // }
    //
    // static ofSuper(functionName: string, args?: ExpressionNode[]): FunctionCallStatement{
    //     return this.create(ts.createSuper(), ts.createIdentifier(functionName), args);
    // }

    getArguments(): ExpressionNode[]{
        return [];
    }

    getGenericTypes(): ReadonlyArray<TypeNode>{
        return this.node.typeArguments.map(t => new TypeNode(t))
    }

    getRaw(): any {
        return this.node;
    }

    public getReturnTypeName(): string{
        return this.node.type.typeName.escapedText
    }

}