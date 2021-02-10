import ClassMethodNode from "./ClassMethodNode";
import TsType from "./TsType";
import FunctionCallStatement from "./FunctionCallStatement";

export default class ConstructorNode extends ClassMethodNode{
    constructor(node){
        super(node);
    }

    public getSuperCall(): FunctionCallStatement{
        let node = this.node.body.statements.find(s =>
            (s.kind == TsType.EXPRESSION_STATEMENT.getId())
            && (s.expression.kind == TsType.CALL_EXPRESSION.getId())
            && (s.expression.expression.kind == TsType.SUPER_KEYWORD.getId())
        );
        return node == null? null: new FunctionCallStatement(node);
    }
}