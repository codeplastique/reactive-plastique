import NameableNode from "./NameableNode";
import FunctionParameterNode from "./FunctionParameterNode";
import StatementNode from "./statement/StatementNode";
import TsModifier from "./TsModifier";
import DecoratorNode from "./DecoratorNode";

export default class ClassMethodNode extends NameableNode{
    constructor(node){
        super(node);
    }

    public getParameters(): FunctionParameterNode[]{
        return (this.node.parameters || []).map(d => new FunctionParameterNode(d));
    }

    addStatementToTop(statement: StatementNode): void{
        this.node.body.statements.unshift(statement.getRaw());
    }

    addStatementToBottom(statement: StatementNode): void{
        this.node.body.statements.push(statement.getRaw());
    }

    public getDecorators(): DecoratorNode[]{
        return (this.node.decorators || []).map(d => new DecoratorNode(d));
    }

    protected hasModifier(type: TsModifier): boolean{
        return (this.node.modifiers || []).some(m => m.kind == type.getId())
    }

    isStatic(): boolean{
        return this.hasModifier(TsModifier.STATIC)
    }

    isPrivate(): boolean{
        return this.hasModifier(TsModifier.PRIVATE)
    }
    isPublic(isExplicit: boolean): boolean{
        let modifiers = this.node.modifiers || [];
        if(isExplicit)
            return this.hasModifier(TsModifier.PUBLIC)
        else
            return modifiers.every(m => m.kind != TsModifier.PRIVATE.getId() && m.kind != TsModifier.PROTECTED);
    }
    isProtected(): boolean{
        return this.hasModifier(TsModifier.PROTECTED)
    }

}