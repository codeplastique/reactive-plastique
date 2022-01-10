import NameableNode from "./NameableNode";
import TsType from "./TsType";
import DecoratorNode from "./DecoratorNode";
import Decoratable from "./Decoratable";
import ExpressionNode from "./ExpressionNode";
import TsModifier from "./TsModifier";
import StatementNode from "./statement/StatementNode";
import Type from "./Type";
import FunctionCallStatement from "./FunctionCallStatement";

export default class ClassPropertyNode extends NameableNode implements Decoratable{
    constructor(node){
        super(node);
    }

    public getDecorators(): DecoratorNode[]{
        return (this.node.decorators || []).map(d => new DecoratorNode(d));
    }

    hasDecorator(name: string): boolean{
        return this.getDecorators().some(d => d.getName() == name)
    }

    protected hasModifier(type: TsModifier): boolean{
        return (this.node.modifiers || []).some(m => m.kind == type.getId())
    }

    public static create(modifiers: TsModifier[] | TsModifier, name: string, value?: ExpressionNode | StatementNode): ClassPropertyNode{
        modifiers = Array.isArray(modifiers)? modifiers: [modifiers];
        let modifiersIds = modifiers.map(m => m.getId());
        let node = ts.createProperty(
            [],
            modifiersIds,
            ts.createIdentifier(name),
            undefined,
            undefined, //ts.createKeywordTypeNode(ts.SyntaxKind.ArrayLiteralExpression),
            value.getRaw()
        )
        return new ClassPropertyNode(node);
    }

    isStatic(): boolean{
        return this.hasModifier(TsModifier.STATIC)
    }
    isReadonly(): boolean{
        return this.hasModifier(TsModifier.READONLY)
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

    getType(): Type | null{

    }

    setValue(arg: any): void{
        this.node.initializer = this.handleValue(arg);
    }

    getValue(): any{
        return this.node.initializer;
    }

    protected handleValue(arg: any): any{
        if(arg === null)
            return ts.createNull();
        else if(arg instanceof ExpressionNode || arg instanceof FunctionCallStatement)
            return arg.getRaw()
        else if(typeof arg === 'string')
            return ts.createStringLiteral(arg);
        else if(arg != null && typeof arg === 'object'){
            let props = [];
            for(let key of Object.keys(arg)){
                let val = this.handleValue(arg[key]);
                props.push(ts.createPropertyAssignment(key, val));
            }
            return ts.createObjectLiteral(props)
        }else
            throw new Error(arg);
    }

    removeDecorator(name: string) {

    }
}