import ExpressionNode from "./ExpressionNode";
import IdentifierNode from "./statement/IdentifierNode";
import StatementNode from "./statement/StatementNode";

export default class AssignmentStatement implements StatementNode{
    constructor(protected readonly node){}


    static create(identifier: IdentifierNode, value: ExpressionNode | StatementNode): AssignmentStatement{
        let raw = ts.createBinary(
            identifier.getRaw(),
            ts.SyntaxKind.FirstAssignment,
            value.getRaw()
        )
        return new AssignmentStatement(raw);
    }

    getRaw(): any {
        return this.node
    }

}