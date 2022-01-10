import StatementNode from "./StatementNode";
import FunctionCallStatement from "../FunctionCallStatement";
import ExpressionNode from "../ExpressionNode";
import AssignmentStatement from "../AssignmentStatement";

export default class IdentifierNode implements StatementNode{
    protected readonly node: any
    constructor(node: any) {
        this.node = node;
    }

    public static of(name: string): IdentifierNode{
        return new IdentifierNode(ts.createIdentifier(name));
    }

    public static createThis(): IdentifierNode{
        return new IdentifierNode(ts.createThis());
    }

    public static createSuper(): IdentifierNode{
        return new IdentifierNode(ts.createSuper());
    }


    getPropertyIdentifier(propertyName: string): IdentifierNode{
        return new IdentifierNode(
            ts.createElementAccess(this, ts.createLiteral(propertyName))
        )
    }

    public createFunctionCallStatement(functionName: string, args?: any[]): FunctionCallStatement{
        return FunctionCallStatement.of(this, functionName, args)
    }

    public createAssignmentStatement(value: ExpressionNode | StatementNode): AssignmentStatement{
        return AssignmentStatement.create(this, value)
    }

    getRaw(): any {
        return this.node
    }
}